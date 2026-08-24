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
  seller: string;
  sellerSlug: string;
  categorySlug: string;
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
  delivery: "Contact the seller for delivery details",
  returns: "Contact the seller for return policy",
  care: "",
};

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
    seller: business.name ?? "Unknown seller",
    sellerSlug: business.slug ?? "",
    categorySlug: extra?.category_slug ?? "",
    image: images[0] ?? "",
    gallery: images.slice(1),
    priceZmw: Number(row.price ?? 0),
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    description: row.description ?? "",
    shipping: {
      leadTime: extra?.shipping_lead_time || FALLBACK.leadTime,
      shipsFrom: storefront.location || FALLBACK.shipsFrom,
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
    location: storefront.location ?? "",
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
  businesses!inner(name, slug, status, business_storefront(location, delivery_policy, returns_policy)),
  product_storefront_extra(category_slug, care_instructions, shipping_lead_time, featured)
`;

function activeProductsQuery(admin: ReturnType<typeof createAdminClient>) {
  return admin
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .is("deleted_at", null)
    .eq("product_type", "finished_good")
    .eq("businesses.status", "active");
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

  const { data: featuredRows } = await (activeProductsQuery(admin) as any)
    .eq("product_storefront_extra.featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  const featured = (featuredRows ?? []).map(toMarketplaceProduct);
  if (featured.length >= limit) return featured;

  const { data: newestRows } = await (activeProductsQuery(admin) as any)
    .order("created_at", { ascending: false })
    .limit(limit);

  const seen = new Set(featured.map((p: MarketplaceProduct) => p.id));
  const filler = (newestRows ?? [])
    .map(toMarketplaceProduct)
    .filter((p: MarketplaceProduct) => !seen.has(p.id));

  return [...featured, ...filler].slice(0, limit);
}

export async function getMarketplaceSellers(): Promise<MarketplaceSeller[]> {
  const admin = createAdminClient();

  const { data: businesses, error } = await admin
    .from("businesses")
    .select("id, name, slug, logo_url, business_storefront(location, banner_url, bio, founded_year, delivery_policy, returns_policy, custom_orders_policy)")
    .eq("status", "active");

  if (error || !businesses) return [];

  const { data: products } = await admin
    .from("products")
    .select("business_id")
    .eq("active", true)
    .is("deleted_at", null)
    .eq("product_type", "finished_good");

  const counts = new Map<string, number>();
  for (const p of products ?? []) {
    counts.set((p as any).business_id, (counts.get((p as any).business_id) ?? 0) + 1);
  }

  return (businesses as any[])
    .map((b) => toMarketplaceSeller(b, counts.get(b.id) ?? 0))
    .filter((s) => s.itemCount > 0)
    .sort((a, b) => b.itemCount - a.itemCount);
}

export interface MarketplaceStats {
  makerCount: number;
  productCount: number;
  orderCount: number;
}

export async function getMarketplaceStats(): Promise<MarketplaceStats> {
  const admin = createAdminClient();

  const [{ count: makerCount }, { count: productCount }, { count: orderCount }] = await Promise.all([
    admin.from("businesses").select("id", { count: "exact", head: true }).eq("status", "active"),
    (admin.from("products") as any)
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .is("deleted_at", null)
      .eq("product_type", "finished_good"),
    (admin.from("orders") as any)
      .select("id", { count: "exact", head: true })
      .in("status", ["completed", "delivered"])
      .is("deleted_at", null),
  ]);

  return {
    makerCount: makerCount ?? 0,
    productCount: productCount ?? 0,
    orderCount: orderCount ?? 0,
  };
}

export async function getMarketplaceSellerBySlug(
  slug: string
): Promise<{ seller: MarketplaceSeller; products: MarketplaceProduct[] } | null> {
  const admin = createAdminClient();

  const { data: business, error } = await admin
    .from("businesses")
    .select("id, name, slug, logo_url, status, business_storefront(location, banner_url, bio, founded_year, delivery_policy, returns_policy, custom_orders_policy)")
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
