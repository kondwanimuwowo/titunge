import type { Metadata } from "next";
import { Hero } from "@/components/marketplace/Hero";
import { CategoryRow } from "@/components/marketplace/CategoryRow";
import { FeaturedProducts } from "@/components/marketplace/FeaturedProducts";
import { MakerSpotlight } from "@/components/marketplace/MakerSpotlight";
import { DualCta } from "@/components/marketplace/DualCta";

export const metadata: Metadata = {
  title: "Titunge — Handmade fashion and tailoring, made in Africa",
  description: "Fabric, garments, and custom pieces from independent makers across Africa.",
};

export default function MarketplaceHomePage() {
  return (
    <>
      <Hero />
      <CategoryRow />
      <FeaturedProducts />
      <MakerSpotlight />
      <DualCta />
    </>
  );
}
