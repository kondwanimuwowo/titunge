"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { ArrowRight, Loader2 } from "lucide-react";
import { advanceMarketplaceOrderStatusAction } from "@/app/actions/marketplace-seller-orders";

const NEXT_LABEL: Record<string, string> = {
  being_sewn: "Mark as shipped",
  shipped: "Mark as delivered",
};

export function AdvanceOrderStatusButton({ orderId, status }: { orderId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const label = NEXT_LABEL[status];
  if (!label) return null;

  const handleClick = () => {
    startTransition(async () => {
      const result = await advanceMarketplaceOrderStatusAction(orderId);
      if (result.success) toast.success(label);
      else toast.error(result.message || "Failed to update order");
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-4 py-2 text-white disabled:opacity-60"
      style={{ backgroundColor: "#5fa8a0" }}
    >
      {isPending ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
      {isPending ? "Updating..." : label}
    </button>
  );
}
