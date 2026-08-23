import { NextResponse } from "next/server";
import { getMarketplaceProducts } from "@/lib/marketplace-db";

/** Public, read-only. Backs CartProvider and the cart/checkout/order pages,
 *  which are client components and can't call marketplace-db.ts directly. */
export async function GET() {
  const products = await getMarketplaceProducts();
  return NextResponse.json(products);
}
