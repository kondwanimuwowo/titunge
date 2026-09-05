import type { MetadataRoute } from "next";
import { getMarketplaceProducts, getMarketplaceSellers } from "@/lib/marketplace-db";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";
const BASE_URL = `https://${APP_DOMAIN}`;

// Only the public marketplace/marketing surface — ERP dashboard pages are
// behind auth and tenant-scoped, so they don't belong in a public sitemap.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, sellers] = await Promise.all([getMarketplaceProducts(), getMarketplaceSellers()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/browse`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/business`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/sell`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/pricing`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/product/${p.id}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const shopRoutes: MetadataRoute.Sitemap = sellers.map((s) => ({
    url: `${BASE_URL}/shop/${s.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...shopRoutes];
}
