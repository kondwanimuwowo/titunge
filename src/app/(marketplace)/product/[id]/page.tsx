import Link from "next/link";
import type { Metadata } from "next";
import { getMarketplaceProductById, getMarketplaceSellerBySlug } from "@/lib/marketplace-db";
import { getWishlistedProductIds } from "@/app/actions/marketplace-wishlist";
import { ProductDetailClient } from "@/components/marketplace/ProductDetailClient";
import { formatZmw } from "@/lib/marketplace-currency";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getMarketplaceProductById(id);
  if (!product) return { title: "Product not found | Titunge" };

  const title = `${product.name} by ${product.seller} | Titunge Marketplace`;
  const description = `${product.description.slice(0, 155)} ${formatZmw(product.priceZmw)}, by ${product.seller} on Titunge.`;

  return {
    title,
    description,
    openGraph: { title, description, images: [product.image] },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getMarketplaceProductById(id);

  if (!product) {
    return (
      <section className="flex flex-col items-center justify-center text-center px-6 py-32">
        <h1 className="text-3xl font-bold text-[#0e1a18]" style={{ fontFamily: "var(--font-canter)" }}>
          Product not found
        </h1>
        <p className="mt-4 text-gray-500 max-w-md">This item may have sold out or been removed.</p>
        <Link
          href="/browse"
          className="mt-8 text-white text-sm font-semibold rounded-full px-7 py-3 transition-colors hover:bg-[#4f958d]"
          style={{ backgroundColor: "#5fa8a0" }}
        >
          Browse the marketplace
        </Link>
      </section>
    );
  }

  const shopResult = product.sellerSlug ? await getMarketplaceSellerBySlug(product.sellerSlug) : null;
  const moreFromShop = (shopResult?.products ?? []).filter((p) => p.id !== product.id);
  const wishlistedIds = await getWishlistedProductIds();

  return (
    <ProductDetailClient
      product={product}
      moreFromShop={moreFromShop}
      initialWishlisted={wishlistedIds.includes(product.id)}
    />
  );
}
