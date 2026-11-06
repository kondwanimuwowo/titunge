import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseClient } from "@/components/marketplace/BrowseClient";
import { getMarketplaceProducts } from "@/lib/marketplace-db";
import { mixBySeller } from "@/lib/marketplace-mix";

// The product list changes as sellers list; never prerender at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse | Titunge marketplace",
  description: "Shop fabric, garments, and made-to-order pieces from Zambian makers.",
};


export default async function BrowsePage() {
  const products = mixBySeller(await getMarketplaceProducts());

  return (
    <Suspense fallback={null}>
      <BrowseClient products={products} />
    </Suspense>
  );
}
