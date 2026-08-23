import { ProductCard } from "./ProductCard";
import type { MarketplaceProduct } from "@/lib/marketplace-db";

export function FeaturedProducts({ products }: { products: MarketplaceProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section id="new" className="pt-4 pb-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-8">New this week</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
