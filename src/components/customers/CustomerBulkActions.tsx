"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { deleteCustomerAction } from "@/app/actions/customers";

export function CustomerBulkActions({
  selected,
  clearSelection,
}: {
  selected: { id: string; name: string }[];
  clearSelection: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleBulkDelete = () => {
    if (!window.confirm(`Delete ${selected.length} customer(s)? This can be undone from the recycle bin.`)) return;
    startTransition(async () => {
      const results = await Promise.all(selected.map((c) => deleteCustomerAction(c.id)));
      const failed = results.filter((r) => !r?.success).length;
      if (failed > 0) toast.error(`${failed} customer(s) failed to delete`);
      else toast.success(`${selected.length} customer(s) deleted`);
      clearSelection();
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleBulkDelete}
      disabled={isPending}
      className="h-8 text-xs font-medium text-destructive px-2.5 rounded-md hover:bg-destructive/10 disabled:opacity-40"
    >
      Delete selected
    </button>
  );
}
