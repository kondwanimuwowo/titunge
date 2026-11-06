import { createAdminClient } from "@/lib/supabase/server";

/**
 * Public marketplace reads, deliberately cross-tenant. Uses the service-role
 * client to bypass per-business RLS on purpose — the marketplace shows
 * products from every active business to anonymous visitors, not just one
 * tenant's own data. Since RLS isn't doing any filtering for us here, every
 * query below explicitly filters to active businesses/products.
 *
 * Results are shaped as MarketplaceProduct/MarketplaceSeller so the existing
 * marketplace UI (ProductCard, BrowseClient, ShopPageClient, ProductDetailClient,
 * MakerSpotlight) needs no changes beyond where the data comes from.
 */

export interface MarketplaceProductShipping {
  leadTime: string;
  shipsFrom: string;
  delivery: string;
  returns: string;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  businessId: string;
  marketplaceFeeMode: "absorb" | "pass_to_customer";
  sizingStandard: "not_specified" | "uk" | "us" | "aus";
  seller: string;
  sellerSlug: string;
  categorySlug: string;
  province: string;
  image: string;
  gallery: string[];
  priceZmw: number;
  sizes: string[];
  description: string;
  shipping: MarketplaceProductShipping;
  care: string;
  rating?: number;
  reviewCount?: number;
}

export interface MarketplaceSellerPolicies {
  delivery: string;
  returns: string;
  customOrders: string;
}

export interface MarketplaceSeller {
  slug: string;
  name: string;
  location: string;
  province: string;
  avatar: string;
  banner: string;
  bio: string;
  itemCount: number;
  founded?: number;
  rating?: number;
  salesCount?: number;
  categories: string[];
  policies: MarketplaceSellerPolicies;
}

const FALLBACK = {
  leadTime: "Contact the seller for lead time",
  shipsFrom: "Not specified",
  delivery: "Arranged with the seller after you pay",
  returns: "Contact the seller for return policy",
  care: "",
};

/** "Kabulonga" + "Lusaka" -> "Kabulonga, Lusaka Province", without repeating
 *  the province when the seller already typed it into their location. */
function formatPlace(location: string | null | undefined, province: string | null | undefined): string {
  const town = (location ?? "").trim();
  if (!province) return town;
  if (town.toLowerCase().includes(province.toLowerCase())) return town;
  return town ? `${town}, ${province} Province` : `${province} Province`;
}

function toMarketplaceProduct(row: any): MarketplaceProduct {
  const business = row.businesses ?? {};
  const storefront = Array.isArray(business.business_storefront)
    ? business.business_storefront[0] ?? {}
    : business.business_storefront ?? {};
  const extra = Array.isArray(row.product_storefront_extra)
    ? row.product_storefront_extra[0]
    : row.product_storefront_extra;
  const images: string[] = Array.isArray(row.images) ? row.images : [];

  return {
    id: row.id,
    name: row.name,
    businessId: row.business_id,
    marketplaceFeeMode: business.marketplace_fee_mode === "pass_to_customer" ? "pass_to_customer" : "absorb",
    sizingStandard: ["uk", "us", "aus"].includes(business.sizing_standard) ? business.sizing_standard : "not_specified",
    seller: business.name ?? "Unknown seller",
    sellerSlug: business.slug ?? "",
    categorySlug: extra?.category_slug ?? "",
    province: storefront.province ?? "",
    image: images[0] ?? "",
    gallery: images.slice(1),
    priceZmw: Number(row.price ?? 0),
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    description: row.description ?? "",
    shipping: {
      leadTime: extra?.shipping_lead_time || FALLBACK.leadTime,
      shipsFrom: formatPlace(storefront.location, storefront.province) || FALLBACK.shipsFrom,
      delivery: storefront.delivery_policy || FALLBACK.delivery,
      returns: storefront.returns_policy || FALLBACK.returns,
    },
    care: extra?.care_instructions || FALLBACK.care,
  };
}

function toMarketplaceSeller(row: any, itemCount: number): MarketplaceSeller {
  const storefront = Array.isArray(row.business_storefront)
    ? row.business_storefront[0] ?? {}
    : row.business_storefront ?? {};
  return {
    slug: row.slug,
    name: row.name,
    location: formatPlace(storefront.location, storefront.province),
    province: storefront.province ?? "",
    avatar: row.logo_url ?? "",
    banner: storefront.banner_url ?? "",
    bio: storefront.bio ?? "",
    itemCount,
    founded: storefront.founded_year ?? undefined,
    categories: [],
    policies: {
      delivery: storefront.delivery_policy || FALLBACK.delivery,
      returns: storefront.returns_policy || FALLBACK.returns,
      customOrders: storefront.custom_orders_policy || "Contact the seller about custom orders.",
    },
  };
}

const PRODUCT_SELECT = `
  id, name, description, price, sizes, images, business_id, created_at,
  businesses!inner(name, slug, status, marketplace_fee_mode, sizing_standard, business_storefront(location, province, delivery_policy, returns_policy)),
  product_storefront_extra(category_slug, care_instructions, shipping_lead_time, featured)
`;

// Products without a photo are never listed, so the marketplace stays visual.
// The product form and Settings > Storefront tell sellers this.
interface PhotoFilterable<Q> {
  not(column: string, operator: string, value: unknown): Q;
  neq(column: string, value: unknown): Q;
}

function withPhoto<Q extends PhotoFilterable<Q>>(query: Q): Q {
  return query.not("images", "is", null).neq("images", "[]");
}

function activeProductsQuery(admin: ReturnType<typeof createAdminClient>) {
  return withPhoto(
    admin
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("active", true)
      .is("deleted_at", null)
      .eq("product_type", "finished_good")
      .eq("businesses.status", "active")
  );
}

export async function getMarketplaceProducts(): Promise<MarketplaceProduct[]> {
  const admin = createAdminClient();
  const { data, error } = await (activeProductsQuery(admin) as any).order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(toMarketplaceProduct);
}

export async function getMarketplaceProductById(id: string): Promise<MarketplaceProduct | null> {
  const admin = createAdminClient();
  const { data, error } = await (activeProductsQuery(admin) as any).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return toMarketplaceProduct(data);
}

export async function getFeaturedProducts(limit = 8): Promise<MarketplaceProduct[]> {
  const admin = createAdminClient();

  // Pull a larger candidate pool than `limit` so that prioritizing products
  // with a real photo (below) has something to actually pick from, instead
  // of just re-sorting whatever the first `limit` rows happened to be.
  const candidatePoolSize = Math.max(limit * 3, 24);

  const { data: featuredRows } = await (activeProductsQuery(admin) as any)
    .eq("product_storefront_extra.featured", true)
    .order("created_at", { ascending: false })
    .limit(candidatePoolSize);

  const featured = (featuredRows ?? []).map(toMarketplaceProduct);

  const { data: newestRows } = await (activeProductsQuery(admin) as any)
    .order("created_at", { ascending: false })
    .limit(candidatePoolSize);

  const seen = new Set(featured.map((p: MarketplaceProduct) => p.id));
  const filler = (newestRows ?? [])
    .map(toMarketplaceProduct)
    .filter((p: MarketplaceProduct) => !seen.has(p.id));

  // Stable sort: products with a real photo first, but otherwise keeping
  // the existing order (featured-before-filler, newest-first within each).
  const combined = [...featured, ...filler].sort(
    (a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image))
  );

  return combined.slice(0, limit);
}

export async function getMarketplaceSellers(): Promise<MarketplaceSeller[]> {
  const admin = createAdminClient();

  const { data: businesses, error } = await admin
    .from("businesses")
    .select("id, name, slug, logo_url, business_storefront(location, province, banner_url, bio, founded_year, delivery_policy, returns_policy, custom_orders_policy)")
    .eq("status", "active");

  if (error || !businesses) return [];

  const { data: products } = await withPhoto(
    admin
      .from("products")
      .select("business_id")
      .eq("active", true)
      .is("deleted_at", null)
      .eq("product_type", "finished_good")
  );

  const counts = new Map<string, number>();
  for (const p of products ?? []) {
    counts.set((p as any).business_id, (counts.get((p as any).business_id) ?? 0) + 1);
  }

  return (businesses as any[])
    .map((b) => toMarketplaceSeller(b, counts.get(b.id) ?? 0))
    .filter((s) => s.itemCount > 0)
    .sort((a, b) => b.itemCount - a.itemCount);
}

export interface PublicPricing {
  /** Marketplace commission as a whole-number percent, e.g. 10. */
  commissionPercent: number;
  seatPriceKwacha: number;
  payoutReleaseHours: number;
}

/** Live plan/fee figures for public marketing pages, so copy can never drift
 *  from what billing and payouts actually charge. Falls back to the schema
 *  defaults if the settings row can't be read. */
export async function getPublicPricing(): Promise<PublicPricing> {
  const admin = createAdminClient();
  const { data } = await (admin.from("platform_settings") as any)
    .select("commission_rate, seat_price_kwacha, payout_release_window_hours")
    .eq("id", true)
    .maybeSingle();

  return {
    commissionPercent: Math.round(Number(data?.commission_rate ?? 0.1) * 100),
    seatPriceKwacha: Number(data?.seat_price_kwacha ?? 250),
    payoutReleaseHours: Number(data?.payout_release_window_hours ?? 24),
  };
}

export async function getMarketplaceSellerBySlug(
  slug: string
): Promise<{ seller: MarketplaceSeller; products: MarketplaceProduct[] } | null> {
  const admin = createAdminClient();

  const { data: business, error } = await admin
    .from("businesses")
    .select("id, name, slug, logo_url, status, business_storefront(location, province, banner_url, bio, founded_year, delivery_policy, returns_policy, custom_orders_policy)")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error || !business) return null;

  const { data: productRows } = await (activeProductsQuery(admin) as any).eq("business_id", (business as any).id);
  const products = (productRows ?? []).map(toMarketplaceProduct);

  return {
    seller: {
      ...toMarketplaceSeller(business as any, products.length),
      categories: Array.from(new Set(products.map((p: MarketplaceProduct) => p.categorySlug).filter(Boolean))),
    },
    products,
  };
}
