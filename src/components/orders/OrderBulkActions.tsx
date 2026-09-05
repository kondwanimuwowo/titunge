"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { deleteOrder, updateOrderStatus } from "@/app/actions/orders";

const STATUS_OPTIONS = [
  { value: "enquiry", label: "Enquiry" },
  { value: "contacted", label: "Contacted" },
  { value: "measurements", label: "Measurements" },
  { value: "production", label: "Production" },
  { value: "fitting", label: "Fitting" },
  { value: "completed", label: "Completed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrderBulkActions({
  selected,
  clearSelection,
}: {
  selected: { id: string; order_number: string }[];
  clearSelection: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState("");

  const handleBulkStatus = () => {
    if (!status) return;
    startTransition(async () => {
      const results = await Promise.all(selected.map((o) => updateOrderStatus(o.id, status)));
      const failed = results.filter((r) => !r?.success).length;
      if (failed > 0) toast.error(`${failed} order(s) failed to update`);
      else toast.success(`${selected.length} order(s) updated`);
      clearSelection();
      router.refresh();
    });
  };

  const handleBulkDelete = () => {
    if (!window.confirm(`Delete ${selected.length} order(s)? This can be undone from the recycle bin.`)) return;
    startTransition(async () => {
      const results = await Promise.all(selected.map((o) => deleteOrder(o.id)));
      const failed = results.filter((r) => !r?.success).length;
      if (failed > 0) toast.error(`${failed} order(s) failed to delete`);
      else toast.success(`${selected.length} order(s) deleted`);
      clearSelection();
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={isPending}
        className="h-8 text-xs border border-input rounded-md px-2 bg-background"
      >
        <option value="">Change status to...</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleBulkStatus}
        disabled={isPending || !status}
        className="h-8 text-xs font-medium text-primary px-2.5 rounded-md hover:bg-primary/10 disabled:opacity-40"
      >
        Apply
      </button>
      <span className="h-4 w-px bg-border" />
      <button
        type="button"
        onClick={handleBulkDelete}
        disabled={isPending}
        className="h-8 text-xs font-medium text-destructive px-2.5 rounded-md hover:bg-destructive/10 disabled:opacity-40"
      >
        Delete selected
      </button>
    </div>
  );
}
