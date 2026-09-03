"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { RotateCcw, XCircle } from "lucide-react";
import { retryBillingChargeAction, cancelBillingChargeAction } from "@/app/actions/admin-billing";

export default function AdminBillingRowActions({ chargeId }: { chargeId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleRetry = () => {
    startTransition(async () => {
      const result = await retryBillingChargeAction(chargeId);
      if (result.success) toast.success("Charge queued for retry");
      else toast.error(result.message || "Failed to retry charge");
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelBillingChargeAction(chargeId);
      if (result.success) toast.success("Charge cancelled");
      else toast.error(result.message || "Failed to cancel charge");
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
