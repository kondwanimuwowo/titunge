"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { XCircle } from "lucide-react";
import { cancelMarketplaceOrderAction } from "@/app/actions/admin-orders";

export default function CancelOrderAction({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelMarketplaceOrderAction(orderId, reason);
      if (result.success) {
        toast.success("Order cancelled — payouts stopped");
        setOpen(false);
        setReason("");
      } else {
        toast.error(result.message || "Failed to cancel order");
      }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-destructive hover:underline"
      >
        <XCircle size={12} />
        Cancel order
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 items-end">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (shown in payout log)"
        className="text-xs border border-input rounded-md px-2 py-1 w-48 bg-background"
      />
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:underline">
          Back
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
        >
          {isPending ? "Cancelling..." : "Confirm cancel"}
        </button>
      </div>
    </div>
  );
}
