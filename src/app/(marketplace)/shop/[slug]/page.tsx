import Link from "next/link";
import { MARKETPLACE_SELLERS } from "@/data/marketplace-sellers";
import { MARKETPLACE_PRODUCTS } from "@/data/marketplace-products";
import { ShopPageClient } from "@/components/marketplace/ShopPageClient";

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const seller = MARKETPLACE_SELLERS.find((s) => s.slug === slug);

  if (!seller) {
    return (
      <section className="flex flex-col items-center justify-center text-center px-6 py-32">
        <h1 className="text-3xl font-bold text-[#0e1a18]" style={{ fontFamily: "var(--font-canter)" }}>
          Shop not found
        </h1>
        <p className="mt-4 text-gray-500 max-w-md">This seller doesn&apos;t have a shop on Titunge yet.</p>
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

  const products = MARKETPLACE_PRODUCTS.filter((p) => p.sellerSlug === slug);

  return <ShopPageClient seller={seller} products={products} />;
}
