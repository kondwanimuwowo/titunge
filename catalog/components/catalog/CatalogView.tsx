"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "./ProductCard";
import { Input } from "@/components/ui/Input";
import { Search, ChevronDown, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CatalogViewProps {
  products: any[];
  finishedGoods: any[];
  categories: string[];
}

export function CatalogView({ products, finishedGoods, categories }: CatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeType, setActiveType] = useState<"all" | "custom" | "rtw">("all");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">("newest");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const filteredItems = useMemo(() => {
    let items: any[] = [];

    if (activeType === "all" || activeType === "custom") {
      items = [...items, ...products.map(p => ({ ...p, _type: 'custom' }))];
    }

    if (activeType === "all" || activeType === "rtw") {
      items = [...items, ...finishedGoods.map(p => ({ ...p, _type: 'rtw' }))];
    }

    if (activeCategory !== "All") {
      items = items.filter(item => item.category === activeCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }

    items.sort((a, b) => {
      if (sortBy === "price-asc") {
        const priceA = a.base_price;
        const priceB = b.base_price;
        return priceA - priceB;
      }
      if (sortBy === "price-desc") {
        const priceA = a.base_price;
        const priceB = b.base_price;
        return priceB - priceA;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return items;
  }, [products, finishedGoods, activeCategory, activeType, searchQuery, sortBy]);

  const filterChip = (label: string, isActive: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      className={`text-left text-xs font-medium rounded-full px-4 py-2 border transition-all duration-200 ${
        isActive
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-white/40 text-muted-foreground border-border/70 hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  const filterContent = (
    <div className="space-y-9">
      <div className="space-y-3">
        <h3 className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">Search</h3>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10 pr-4 h-11 rounded-full border border-border/70 bg-white/50 focus-visible:border-primary text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">Collection</h3>
        <div className="flex flex-wrap gap-2">
          {filterChip("All Collections", activeType === "all", () => setActiveType("all"))}
          {filterChip("Bespoke / Custom", activeType === "custom", () => setActiveType("custom"))}
          {filterChip("Ready to Wear", activeType === "rtw", () => setActiveType("rtw"))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">Category</h3>
        <div className="flex flex-wrap gap-2">
          {filterChip("All Categories", activeCategory === "All", () => setActiveCategory("All"))}
          {categories.map(category =>
            filterChip(category, activeCategory === category, () => setActiveCategory(category))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-12">
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsMobileFilterOpen(true)}
        className="md:hidden flex items-center gap-2 rounded-full text-sm font-medium uppercase tracking-[0.15em] border border-foreground px-5 py-3 text-foreground hover:bg-foreground hover:text-background transition-all duration-300 w-fit"
      >
        <Sliders className="h-4 w-4" />
        Filters
      </button>

      {/* Mobile Filter Modal */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMobileFilterOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-0 inset-x-0 z-50 bg-background rounded-t-[28px] max-h-[80vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-[0.15em]">Filters</h2>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="px-6 py-6">
                {filterContent}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Filters - Desktop Only */}
      <aside className="hidden md:flex w-64 shrink-0 sticky top-32 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar flex-col">
        <div className="glass-card rounded-[28px] p-7">{filterContent}</div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{filteredItems.length}</span> {filteredItems.length === 1 ? 'piece' : 'pieces'}
          </p>
          <div className="relative flex items-center rounded-full border border-border/70 bg-white/40 pl-4 pr-3">
            <select
              className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer text-muted-foreground appearance-none pr-5 py-2"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <ChevronDown className="h-3 w-3 text-muted-foreground -ml-5 pointer-events-none" />
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={`${item._type}-${item.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard
                    product={item}
                    isFinishedGood={item._type === 'rtw'}
                    index={index}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
            <p className="text-lg font-serif">No pieces found</p>
            <p className="text-muted-foreground text-sm max-w-md font-light">
              We couldn&apos;t find any products matching your filters. Try adjusting your search or category.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
                setActiveType("all");
              }}
              className="rounded-full text-sm font-medium uppercase tracking-[0.15em] border border-foreground px-6 py-2.5 text-foreground hover:bg-foreground hover:text-background transition-all duration-300 mt-4"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
