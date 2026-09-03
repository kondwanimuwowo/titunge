"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { RotateCcw, XCircle } from "lucide-react";
import { retryPayoutAction, cancelPayoutAction } from "@/app/actions/admin-payouts";

export default function AdminPayoutRowActions({ payoutId }: { payoutId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleRetry = () => {
    startTransition(async () => {
      const result = await retryPayoutAction(payoutId);
      if (result.success) toast.success("Payout queued for retry");
      else toast.error(result.message || "Failed to retry payout");
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelPayoutAction(payoutId);
      if (result.success) toast.success("Payout cancelled");
      else toast.error(result.message || "Failed to cancel payout");
    });
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleRetry}
        disabled={isPending}
        className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
      >
        <RotateCcw size={12} />
        Retry
      </button>
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
      >
        <XCircle size={12} />
        Cancel
      </button>
    </div>
  );
}
