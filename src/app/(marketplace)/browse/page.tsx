import { Suspense } from "react";
import { BrowseClient } from "@/components/marketplace/BrowseClient";
import { getMarketplaceProducts } from "@/lib/marketplace-db";

export default async function BrowsePage() {
  const products = await getMarketplaceProducts();

  return (
    <Suspense fallback={null}>
      <BrowseClient products={products} />
    </Suspense>
  );
}
