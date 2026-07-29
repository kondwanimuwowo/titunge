"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { XCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cancelOrder } from "@/app/actions/orders";

interface CancelOrderDialogProps {
  orderId: string;
  orderNumber: string;
  stockWillRestore: boolean;
}

export default function CancelOrderDialog({ orderId, orderNumber, stockWillRestore }: CancelOrderDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    startTransition(async () => {
      const result = await cancelOrder(orderId, reason.trim());
      if (result.success) {
        toast.success("Order cancelled");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message || "Failed to cancel order");
      }
    });
  };

  return (
    <>
      {/* @ts-ignore */}
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30"
      >
        <XCircle className="h-4 w-4" />
        Cancel Order
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Cancel Order {orderNumber}</DialogTitle>
            <DialogDescription>This will mark the order as cancelled. Please provide a reason.</DialogDescription>
          </DialogHeader>

          {stockWillRestore && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Materials already deducted for this order will be restored to stock automatically.
            </div>
          )}

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this order being cancelled?"
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background resize-none"
            disabled={isPending}
          />

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Back
            </Button>
            {/* @ts-ignore */}
            <Button type="button" variant="destructive" onClick={handleCancel} loading={isPending}>
              Confirm Cancellation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
