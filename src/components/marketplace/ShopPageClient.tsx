"use client";

import { useMemo, useState } from "react";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { ProductCard } from "./ProductCard";
import { ReviewsSection } from "./ReviewsSection";
import type { MarketplaceSeller } from "@/data/marketplace-sellers";
import type { MarketplaceProduct } from "@/data/marketplace-products";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";

interface ShopPageClientProps {
  seller: MarketplaceSeller;
  products: MarketplaceProduct[];
}

export function ShopPageClient({ seller, products }: ShopPageClientProps) {
  const [following, setFollowing] = useState(false);
  const [filter, setFilter] = useState("");

  const filterOptions = useMemo(() => {
    return seller.categories.map((slug) => MARKETPLACE_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug);
  }, [seller.categories]);

  const filteredProducts = filter ? products.filter((p) => MARKETPLACE_CATEGORIES.find((c) => c.slug === p.categorySlug)?.name === filter) : products;

  return (
    <div>
      <section className="relative">
        <ImagePlaceholder shape="rect" className="h-[280px] w-full rounded-none" src={seller.banner} alt={`${seller.name} banner`} />
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="-mt-12 flex flex-col items-start gap-3">
            <ImagePlaceholder shape="circle" className="w-32 h-32 border-4 border-white" src={seller.avatar} alt={seller.name} />
            <h1 className="text-3xl font-extrabold tracking-tight">{seller.name}</h1>
            <p className="text-sm text-gray-500">
              {seller.location} · Founded {seller.founded}
            </p>
            <p className="text-sm text-gray-500">
              {seller.rating.toFixed(1)} rating · {seller.salesCount} sales · {seller.itemCount} items
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFollowing((v) => !v)}
                className="text-sm font-semibold rounded-full px-6 py-2.5 transition-colors"
                style={{
                  backgroundColor: following ? "#5fa8a0" : "#0e1a18",
                  color: "#ffffff",
                }}
              >
                {following ? "Following" : "Follow shop"}
              </button>
              <span className="text-sm font-semibold text-gray-500">Message</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xl text-gray-600 mt-2">{seller.bio}</p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
        <div className="flex gap-3 overflow-x-auto pb-2 mb-8">
          <button
            type="button"
            onClick={() => setFilter("")}
            className="shrink-0 text-sm font-semibold rounded-full px-5 py-2"
            style={{ backgroundColor: filter === "" ? "#0e1a18" : "#f5f5f5", color: filter === "" ? "#fff" : "#0e1a18" }}
          >
            All
          </button>
          {filterOptions.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              className="shrink-0 text-sm font-semibold rounded-full px-5 py-2"
              style={{ backgroundColor: filter === name ? "#0e1a18" : "#f5f5f5", color: filter === name ? "#fff" : "#0e1a18" }}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <ReviewsSection />

        <section className="py-12 border-t border-gray-100">
          <h2 className="text-xl font-bold mb-6">Shop policies</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-bold mb-2">Delivery</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{seller.policies.delivery}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-2">Returns</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{seller.policies.returns}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-2">Custom orders</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{seller.policies.customOrders}</p>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
