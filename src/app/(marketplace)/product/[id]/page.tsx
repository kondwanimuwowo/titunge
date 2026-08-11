import Link from "next/link";
import { MARKETPLACE_PRODUCTS } from "@/data/marketplace-products";
import { ProductDetailClient } from "@/components/marketplace/ProductDetailClient";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = MARKETPLACE_PRODUCTS.find((p) => p.id === id);

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

  return <ProductDetailClient product={product} />;
}
