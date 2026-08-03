"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Tables } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteProductAction } from "@/app/actions/products";
import { Plus, Edit2, Trash2, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductListProps {
  initialProducts: Tables<"products">[];
}

export default function ProductList({ initialProducts }: ProductListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    startTransition(async () => {
      const result = await deleteProductAction(id);
      if (result.success) {
        toast.success("Product deleted");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete");
      }
    });
  };

  // Filter products
  let filteredProducts = initialProducts;

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Add Button */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <Link href="/products/new">
          <Button className="gap-2 w-full md:w-auto" size="sm">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Search Box */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name, category, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white group cursor-pointer"
              onClick={() => router.push(`/products/${product.id}`)}
            >
              {/* Image */}
              <div className="aspect-square bg-muted/50 relative overflow-hidden">
                {Array.isArray(product.images) && (product.images as string[])[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(product.images as string[])[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Link href={`/products/${product.id}/edit`}>
                    <Button size="sm" variant="secondary">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(product.id, product.name)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                  {product.product_type !== "custom_design" && (
                    <Badge
                      variant={parseInt(String(product.stock_quantity || 0)) > 0 ? "secondary" : "destructive"}
                      className="text-xs shrink-0"
                    >
                      {parseInt(String(product.stock_quantity || 0)) > 0 ? "In Stock" : "Out of Stock"}
                    </Badge>
                  )}
                </div>

                {product.category && (
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                )}

                <p className="text-sm font-semibold text-primary">
                  K{parseFloat(String(product.price || 0)).toFixed(2)}
                </p>

                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
