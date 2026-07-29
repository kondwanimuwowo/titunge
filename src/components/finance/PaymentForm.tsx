"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPayment } from "@/app/actions/finance";

const NO_ORDER = "__none";

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Mobile Money"];

interface PaymentFormProps {
  orders: { id: string; order_number: string; total_cost: number }[];
  defaultOrderId?: string;
}

type FormData = {
  order_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  notes: string;
};

export default function PaymentForm({ orders, defaultOrderId }: PaymentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      order_id: defaultOrderId || NO_ORDER,
      payment_date: format(new Date(), "yyyy-MM-dd"),
      amount: 0,
      payment_method: "",
      reference_number: "",
      notes: "",
    },
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const result = await addPayment({
        ...data,
        order_id: data.order_id === NO_ORDER ? "" : data.order_id,
        amount: parseFloat(String(data.amount)),
      });

      if (result.success) {
        toast.success("Payment recorded");
        router.push("/finance");
      } else {
        toast.error(result.message || "Failed to record payment");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div>
        <Label htmlFor="order_id">Order</Label>
        <Controller
          name="order_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
              <SelectTrigger id="order_id" className="w-full">
                <SelectValue placeholder="-- No linked order --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ORDER}>-- No linked order --</SelectItem>
                {orders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.order_number} (K{parseFloat(String(o.total_cost || 0)).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="payment_date">Date *</Label>
          <Input id="payment_date" type="date" {...register("payment_date", { required: true })} disabled={isPending} />
        </div>
        <div>
          <Label htmlFor="amount">Amount (K) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register("amount", { required: true, min: 0.01 })}
            placeholder="0.00"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="payment_method">Payment Method</Label>
          <Controller
            name="payment_method"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                <SelectTrigger id="payment_method" className="w-full">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="reference_number">Reference #</Label>
          <Input
            id="reference_number"
            {...register("reference_number")}
            placeholder="Optional reference"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          {...register("notes")}
          placeholder="Additional notes"
          className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
          rows={2}
          disabled={isPending}
        />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.push("/finance")} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>Record Payment</Button>
      </div>
    </form>
  );
}
