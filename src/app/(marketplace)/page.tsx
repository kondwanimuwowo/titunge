import type { Metadata } from "next";
import { Hero } from "@/components/marketplace/Hero";
import { CategoryRow } from "@/components/marketplace/CategoryRow";
import { FeaturedProducts } from "@/components/marketplace/FeaturedProducts";
import { MakerSpotlight } from "@/components/marketplace/MakerSpotlight";
import { DualCta } from "@/components/marketplace/DualCta";
import { getFeaturedProducts, getMarketplaceSellers } from "@/lib/marketplace-db";

// Featured products and makers change as sellers list; never prerender at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Titunge: handmade fashion and tailoring from Zambian makers",
  description: "Fabric, garments, and custom pieces from independent makers across Zambia.",
};

export default async function MarketplaceHomePage() {
  const [featuredProducts, sellers] = await Promise.all([
    getFeaturedProducts(8),
    getMarketplaceSellers(),
  ]);

  return (
    <>
      <Hero />
      <CategoryRow />
      <FeaturedProducts products={featuredProducts} />
      <MakerSpotlight sellers={sellers.slice(0, 3)} />
      <DualCta />
    </>
  );
}
