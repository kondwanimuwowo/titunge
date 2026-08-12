"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Tables } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteBatchAction, updateBatchStatusAction } from "@/app/actions/production";
import { Plus, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductionListProps {
  initialBatches: any[];
  products?: any[];
  materials?: any[];
}

const STATUSES = [
  { value: "cutting", label: "Cutting", color: "bg-blue-50 text-blue-700" },
  { value: "stitching", label: "Stitching", color: "bg-purple-50 text-purple-700" },
  { value: "finishing", label: "Finishing", color: "bg-amber-50 text-amber-700" },
  { value: "quality_check", label: "QC", color: "bg-cyan-50 text-cyan-700" },
  { value: "completed", label: "Completed", color: "bg-green-50 text-green-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-50 text-red-700" },
];

export default function ProductionList({
  initialBatches,
  products,
  materials,
}: ProductionListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const statusMap = useMemo(() => {
    const map = new Map<string, any>();
    STATUSES.forEach((status) => {
      map.set(status.value, status);
    });
    return map;
  }, []);

  const handleDelete = (batchId: string) => {
    if (!window.confirm("Delete this batch?")) return;

    startTransition(async () => {
      const result = await deleteBatchAction(batchId);
      if (result.success) {
        toast.success("Batch deleted");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete");
      }
    });
  };

  const handleStatusChange = (batchId: string, newStatus: string) => {
    startTransition(async () => {
      const result = await updateBatchStatusAction(batchId, newStatus);
      if (result.success) {
        toast.success("Status updated");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update");
      }
    });
  };

  // Filter batches
  let filtered = initialBatches;

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.batch_number?.toLowerCase().includes(term) ||
        b.products?.name?.toLowerCase().includes(term)
    );
  }

  if (statusFilter) {
    filtered = filtered.filter((b) => b.status === statusFilter);
  }

  const getStatusInfo = (status: string) => {
    return statusMap.get(status) || STATUSES[0];
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search batches or products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <Select value={statusFilter || "__all"} onValueChange={(v) => setStatusFilter(v === "__all" ? "" : v)}>
            <SelectTrigger className="h-9 w-[160px] text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Link href="/production/new">
          <Button className="gap-2 w-full md:w-auto" size="sm">
            <Plus className="h-4 w-4" />
            New Batch
          </Button>
        </Link>
      </div>

      {/* Batches Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">No batches found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((batch) => {
            const statusInfo = getStatusInfo(batch.status);
            const progress = ["cutting", "stitching", "finishing", "quality_check", "completed"].indexOf(
              batch.status
            );

            return (
              <div
                key={batch.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold">{batch.batch_number}</h3>
                    <p className="text-sm text-muted-foreground">{batch.products?.name}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <a href={`/production/${batch.id}`} className="cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(batch.id)}
                        className="cursor-pointer text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Quantity and Image */}
                <div className="flex gap-3 mb-3">
                  {batch.products?.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={batch.products.images[0]}
                      alt={batch.products.name}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-2xl font-bold">{batch.quantity}</p>
                    <p className="text-xs text-muted-foreground">units</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{Math.round(((progress + 1) / 5) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${((progress + 1) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Status Selector */}
                <div className="flex items-center gap-2">
                  <Select
                    value={batch.status}
                    onValueChange={(v) => handleStatusChange(batch.id, v)}
                    disabled={isPending}
                  >
                    <SelectTrigger
                      className={cn(
                        "flex-1 h-8 text-xs font-medium border-none focus:ring-1 focus:ring-primary",
                        statusInfo.color
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
