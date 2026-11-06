"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Breadcrumb } from "./Breadcrumb";
import { ProductCard } from "./ProductCard";
import type { MarketplaceProduct } from "@/lib/marketplace-db";
import { MARKETPLACE_CATEGORIES, categorySlugsMatching } from "@/data/marketplace-categories";
import { ZAMBIA_PROVINCES } from "@/data/zambia-provinces";

type SortOption = "recommended" | "newest" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortOption, string> = {
  recommended: "Recommended",
  newest: "Newest",
  "price-asc": "Price low to high",
  "price-desc": "Price high to low",
};

export function BrowseClient({ products: allProducts }: { products: MarketplaceProduct[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const initialQuery = searchParams.get("q") ?? "";
  const [sort, setSort] = useState<SortOption>("recommended");
  const [query, setQuery] = useState(initialQuery);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = provinces.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  const toggleProvince = (province: string) =>
    setProvinces((current) =>
      current.includes(province) ? current.filter((p) => p !== province) : [...current, province]
    );

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setProvinces([]);
  };

  const category = MARKETPLACE_CATEGORIES.find((c) => c.slug === activeCategory);

  const products = useMemo(() => {
    let list = activeCategory
      ? allProducts.filter((p) => p.categorySlug === activeCategory)
      : allProducts;
    const q = initialQuery.trim().toLowerCase();
    if (q) {
      const matchingCategories = categorySlugsMatching(q);
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          p.seller.toLowerCase().includes(q) ||
          matchingCategories.includes(p.categorySlug)
      );
    }
    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (minPrice && !Number.isNaN(min)) list = list.filter((p) => p.priceZmw >= min);
    if (maxPrice && !Number.isNaN(max)) list = list.filter((p) => p.priceZmw <= max);
    if (provinces.length > 0) list = list.filter((p) => provinces.includes(p.province));
    list = [...list];
    // "recommended" keeps the server's seller-mixed order.
    if (sort === "newest") list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    else if (sort === "price-asc") list.sort((a, b) => a.priceZmw - b.priceZmw);
    else if (sort === "price-desc") list.sort((a, b) => b.priceZmw - a.priceZmw);
    return list;
  }, [allProducts, activeCategory, initialQuery, sort, minPrice, maxPrice, provinces]);

  const selectCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: category?.name ?? "All items" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">{category?.name ?? "All items"}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className="lg:hidden inline-flex items-center gap-2 self-start text-sm font-semibold border border-gray-200 rounded-full px-4 py-2"
        >
          <SlidersHorizontal size={15} />
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>

        <aside className={`${filtersOpen ? "flex" : "hidden"} lg:flex flex-col gap-8`}>
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
            <h3 className="text-sm font-bold mb-3">Price range (K)</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                aria-label="Minimum price"
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5"
              />
              <span className="text-gray-400">to</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                aria-label="Maximum price"
                className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-3">Ships from</h3>
            <div className="flex flex-col gap-2">
              {ZAMBIA_PROVINCES.map((province) => (
                <label key={province} className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={provinces.includes(province)}
                    onChange={() => toggleProvince(province)}
                    className="accent-[#5fa8a0]"
                  />
                  {province}
                </label>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="self-start text-sm font-semibold text-[#0e1a18] underline underline-offset-4 hover:text-[#5fa8a0]"
            >
              Clear filters
            </button>
          )}
        </aside>

        <div>
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <div className="flex items-center w-full max-w-md bg-gray-100 rounded-full pl-5 pr-1.5 py-1.5 gap-3">
              <input
                key={initialQuery}
                type="text"
                defaultValue={initialQuery}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search fabric, garments, and makers"
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#0e1a18] placeholder:text-gray-500 py-1.5"
              />
              <button
                type="submit"
                aria-label="Search"
                className="flex items-center justify-center shrink-0 w-9 h-9 rounded-full text-white transition-colors"
                style={{ backgroundColor: "#5fa8a0" }}
              >
                <Search size={15} />
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-500">
              {products.length} results{initialQuery ? ` for "${initialQuery}"` : ""}
            </span>
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
            <p className="text-sm text-gray-500 py-16 text-center">
              {activeFilterCount > 0 ? "No items match these filters." : "No items in this category yet."}
            </p>
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
