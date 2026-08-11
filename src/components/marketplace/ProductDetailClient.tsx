"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { ProductCard } from "./ProductCard";
import { ReviewsSection } from "./ReviewsSection";
import { Breadcrumb } from "./Breadcrumb";
import { useCart } from "./CartProvider";
import type { MarketplaceProduct } from "@/data/marketplace-products";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";
import { MARKETPLACE_PRODUCTS } from "@/data/marketplace-products";
import { formatZmw } from "@/lib/marketplace-currency";

export function ProductDetailClient({ product }: { product: MarketplaceProduct }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [fav, setFav] = useState(false);
  const [size, setSize] = useState(product.sizes[0]);
  const images = [product.image, ...product.gallery];
  const [activeImage, setActiveImage] = useState(product.image);

  const category = MARKETPLACE_CATEGORIES.find((c) => c.slug === product.categorySlug);
  const moreFromShop = MARKETPLACE_PRODUCTS.filter((p) => p.sellerSlug === product.sellerSlug && p.id !== product.id);

  const handleAddToBasket = () => {
    addItem(product.id, size);
    router.push("/cart");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: category?.name ?? "Shop", href: category ? `/browse?category=${category.slug}` : "/browse" },
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <div className="relative aspect-square">
            <ImagePlaceholder shape="rect" className="absolute inset-0 rounded-xl" src={activeImage} alt={product.name} />
            <button
              type="button"
              aria-label={fav ? "Remove from saved" : "Save"}
              onClick={() => setFav((v) => !v)}
              className="absolute top-4 right-4 p-1"
            >
              <Heart size={24} fill={fav ? "#5fa8a0" : "#ffffff"} stroke={fav ? "#5fa8a0" : "#0e1a18"} strokeWidth={1.5} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-3">
            {images.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveImage(src)}
                className="rounded-xl overflow-hidden"
                style={{ outline: activeImage === src ? "2px solid #5fa8a0" : "none", outlineOffset: 2 }}
              >
                <ImagePlaceholder shape="rect" className="aspect-square" src={src} alt={product.name} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{product.name}</h1>
          <Link href={`/shop/${product.sellerSlug}`} className="text-sm text-gray-500 mt-1 inline-block hover:text-[#0e1a18] transition-colors">
            By {product.seller}
          </Link>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xl font-extrabold">{formatZmw(product.priceZmw)}</span>
            <span className="text-sm text-gray-500">
              {product.rating.toFixed(1)} ({product.reviewCount} reviews)
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mt-4">{product.description}</p>

          <div className="mt-6">
            <h3 className="text-sm font-bold mb-3">Size</h3>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className="text-sm font-semibold rounded-full px-4 py-2"
                  style={{ backgroundColor: size === s ? "#0e1a18" : "#f5f5f5", color: size === s ? "#fff" : "#0e1a18" }}
                >
                  {s}
                </button>
              ))}
            </div>
            {product.sizes.includes("Custom") && (
              <p className="text-xs text-gray-500 mt-2">Select Custom to provide your own measurements after ordering.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              onClick={handleAddToBasket}
              className="text-white text-sm font-bold rounded-full px-8 py-3.5 transition-colors hover:bg-[#4f958d]"
              style={{ backgroundColor: "#5fa8a0" }}
            >
              Add to basket
            </button>
            <Link
              href={`/shop/${product.sellerSlug}`}
              className="bg-gray-100 text-[#0e1a18] text-sm font-bold rounded-full px-8 py-3.5 transition-colors hover:bg-gray-200"
            >
              Visit shop
            </Link>
          </div>

          <div className="mt-8 bg-gray-50 rounded-xl p-5 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span className="text-[#0e1a18]">{product.shipping.leadTime}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Ships from</span>
              <span className="text-[#0e1a18]">{product.shipping.shipsFrom}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery time</span>
              <span className="text-[#0e1a18]">{product.shipping.delivery}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Returns</span>
              <span className="text-[#0e1a18]">{product.shipping.returns}</span>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-bold mb-2">Details</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{product.care}</p>
          </div>
        </div>
      </div>

      <ReviewsSection />

      {moreFromShop.length > 0 && (
        <section className="py-12 border-t border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">More from this shop</h2>
            <Link href={`/shop/${product.sellerSlug}`} className="text-sm text-gray-500 hover:text-[#0e1a18] transition-colors">
              See all items
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {moreFromShop.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
