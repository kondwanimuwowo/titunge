"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Breadcrumb } from "./Breadcrumb";
import { ProductCard } from "./ProductCard";
import { MARKETPLACE_PRODUCTS } from "@/data/marketplace-products";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";

type SortOption = "newest" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  "price-asc": "Price low to high",
  "price-desc": "Price high to low",
};

const SHIPS_FROM = ["Zambia", "Ghana", "Nigeria", "Kenya", "Senegal"];

export function BrowseClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const [sort, setSort] = useState<SortOption>("newest");

  const category = MARKETPLACE_CATEGORIES.find((c) => c.slug === activeCategory);

  const products = useMemo(() => {
    let list = activeCategory
      ? MARKETPLACE_PRODUCTS.filter((p) => p.categorySlug === activeCategory)
      : MARKETPLACE_PRODUCTS;
    list = [...list];
    if (sort === "price-asc") list.sort((a, b) => a.priceZmw - b.priceZmw);
    else if (sort === "price-desc") list.sort((a, b) => b.priceZmw - a.priceZmw);
    return list;
  }, [activeCategory, sort]);

  const selectCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: category?.name ?? "All items" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">{category?.name ?? "All items"}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
        <aside className="flex flex-col gap-8">
          <div>
            <h3 className="text-sm font-bold mb-3">Category</h3>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => selectCategory("")}
                className={`text-left text-sm ${activeCategory === "" ? "font-bold text-[#0e1a18]" : "text-gray-500 hover:text-[#0e1a18]"}`}
              >
                All items
              </button>
              {MARKETPLACE_CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => selectCategory(c.slug)}
                  className={`text-left text-sm ${activeCategory === c.slug ? "font-bold text-[#0e1a18]" : "text-gray-500 hover:text-[#0e1a18]"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3">Price range</h3>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5" />
              <span className="text-gray-400">–</span>
              <input type="number" placeholder="Max" className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3">Ships from</h3>
            <div className="flex flex-col gap-2">
              {SHIPS_FROM.map((country, i) => (
                <label key={country} className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" defaultChecked={i === 0} className="accent-[#5fa8a0]" />
                  {country}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3">Rating</h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" defaultChecked className="accent-[#5fa8a0]" />
                4 stars and up
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="accent-[#5fa8a0]" />
                3 stars and up
              </label>
            </div>
          </div>

          <button
            type="button"
            className="text-white text-sm font-semibold rounded-full px-6 py-2.5 transition-colors hover:bg-[#4f958d]"
            style={{ backgroundColor: "#5fa8a0" }}
          >
            Apply filters
          </button>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-500">{products.length} results</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="text-sm border border-gray-200 rounded-md px-3 py-1.5"
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {products.length === 0 ? (
            <p className="text-sm text-gray-500 py-16 text-center">No items in this category yet.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
