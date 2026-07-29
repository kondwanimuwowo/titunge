"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Tables } from "@/lib/types/database";
import { DataTable } from "@/components/layout/DataTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteMaterialAction } from "@/app/actions/inventory";
import { deleteProductAction } from "@/app/actions/products";
import { MoreHorizontal, Plus, Edit2, Eye, Trash2, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface InventoryListProps {
  initialMaterials: Tables<"materials">[];
  initialFinishedGoods: Tables<"products">[];
}

type Tab = "raw" | "finished";

export default function InventoryList({
  initialMaterials,
  initialFinishedGoods,
}: InventoryListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>("raw");

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;

    startTransition(async () => {
      const result = await deleteMaterialAction(id);
      if (result.success) {
        toast.success("Material deleted");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete");
      }
    });
  };

  const handleDeleteProduct = (id: string, name: string) => {
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

  // Raw Materials columns
  const rawMaterialsColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Material Name",
        cell: ({ row }: any) => (
          <Link href={`/inventory/materials/${row.original.id}`} className="font-semibold text-foreground hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
            {row.getValue("name")}
          </Link>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }: any) => <span className="text-muted-foreground text-sm">{row.getValue("category") || "—"}</span>,
      },
      {
        accessorKey: "unit",
        header: "Unit",
        cell: ({ row }: any) => <span className="text-muted-foreground text-sm">{row.getValue("unit")}</span>,
      },
      {
        accessorKey: "stock_quantity",
        header: "Stock",
        cell: ({ row }: any) => {
          const stock = parseFloat(String(row.getValue("stock_quantity") || 0));
          const minLevel = parseFloat(String(row.original.min_stock_level || 0));
          const isLow = stock <= minLevel;
          return (
            <span className={cn("font-medium", isLow && "text-red-600 flex items-center gap-1")}>
              {stock}
              {isLow && <AlertTriangle className="h-4 w-4" />}
            </span>
          );
        },
      },
      {
        accessorKey: "min_stock_level",
        header: "Min Level",
        cell: ({ row }: any) => <span className="text-muted-foreground text-sm">{row.getValue("min_stock_level") || "0"}</span>,
      },
      {
        accessorKey: "cost_per_unit",
        header: "Cost/Unit",
        cell: ({ row }: any) => <span className="text-sm">K{parseFloat(String(row.getValue("cost_per_unit") || 0)).toFixed(2)}</span>,
      },
      {
        accessorKey: "supplier",
        header: "Supplier",
        cell: ({ row }: any) => <span className="text-muted-foreground text-sm">{row.getValue("supplier") || "—"}</span>,
      },
      {
        id: "actions",
        cell: ({ row }: any) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/inventory/materials/${row.original.id}/stock?mode=add`)}
                className="cursor-pointer"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Restock
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/inventory/materials/${row.original.id}/stock?mode=deduct`)}
                className="cursor-pointer"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Use Stock
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/inventory/materials/${row.original.id}/edit`)}
                className="cursor-pointer"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(row.original.id)}
                className="cursor-pointer text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  // Finished Goods columns
  const finishedGoodsColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Product Name",
        cell: ({ row }: any) => (
          <Link href={`/products/${row.original.id}`} className="font-semibold text-foreground hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
            {row.getValue("name")}
          </Link>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }: any) => <span className="text-muted-foreground text-sm">{row.getValue("category") || "—"}</span>,
      },
      {
        accessorKey: "stock_quantity",
        header: "Stock",
        cell: ({ row }: any) => {
          const stock = parseInt(String(row.getValue("stock_quantity") || 0));
          return (
            <span className={cn("font-medium", stock <= 0 && "text-red-600 flex items-center gap-1")}>
              {stock}
              {stock <= 0 && <AlertTriangle className="h-4 w-4" />}
            </span>
          );
        },
      },
      {
        accessorKey: "cost_per_unit",
        header: "Cost/Unit",
        cell: ({ row }: any) => <span className="text-sm">K{parseFloat(String(row.getValue("cost_per_unit") || 0)).toFixed(2)}</span>,
      },
      {
        id: "actions",
        cell: ({ row }: any) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/products/${row.original.id}`)}
                className="cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/products/${row.original.id}/edit`)}
                className="cursor-pointer"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit / Update Stock
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteProduct(row.original.id, row.original.name)}
                className="cursor-pointer text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router]
  );

  const isRaw = activeTab === "raw";
  const columns = isRaw ? rawMaterialsColumns : finishedGoodsColumns;
  const data = isRaw ? initialMaterials : initialFinishedGoods;

  return (
    <div className="space-y-4">
      {/* Tabs and Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("raw")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              activeTab === "raw"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Raw Materials ({initialMaterials.length})
          </button>
          <button
            onClick={() => setActiveTab("finished")}
            className={cn(
              "px-4 py-2 font-medium transition-colors",
              activeTab === "finished"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Finished Goods ({initialFinishedGoods.length})
          </button>
        </div>

        {activeTab === "raw" && (
          <Link href="/inventory/materials/new">
            <Button className="gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Add Material
            </Button>
          </Link>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns as any}
        data={data as any}
        loading={isPending}
        searchPlaceholder={isRaw ? "Search materials..." : "Search products..."}
      />

    </div>
  );
}
