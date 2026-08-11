import { MARKETPLACE_PRODUCTS } from "@/data/marketplace-products";
import { ProductCard } from "./ProductCard";

export function FeaturedProducts() {
  return (
    <section id="new" className="pt-4 pb-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-8">New this week</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {MARKETPLACE_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
