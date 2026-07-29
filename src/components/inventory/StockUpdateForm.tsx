"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { Tables } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStockAction } from "@/app/actions/inventory";

interface StockUpdateFormProps {
  material: Tables<"materials">;
  mode: "add" | "deduct";
}

interface FormData {
  quantity: number;
  notes: string;
  newPrice?: number;
  useSamePrice: boolean;
}

export default function StockUpdateForm({ material, mode }: StockUpdateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      useSamePrice: true,
      quantity: 0,
      notes: "",
    },
  });

  const quantity = watch("quantity");
  const useSamePrice = watch("useSamePrice");
  const newPrice = watch("newPrice");

  const currentCost = parseFloat(String(material.cost_per_unit || 0));
  const currentStock = parseFloat(String(material.stock_quantity || 0));
  const newStock = mode === "add"
    ? currentStock + Number(quantity)
    : currentStock - Number(quantity);

  let weightedAvgCost = currentCost;
  if (mode === "add" && !useSamePrice && newPrice && Number(newPrice) !== currentCost && newStock > 0) {
    const currentValue = currentStock * currentCost;
    const newStockValue = Number(quantity) * Number(newPrice);
    weightedAvgCost = (currentValue + newStockValue) / newStock;
  }

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const unitCost = data.useSamePrice
        ? currentCost
        : (Number(data.newPrice) || currentCost);

      const result = await updateStockAction(
        material.id,
        Number(data.quantity),
        mode,
        data.notes,
        null,
        unitCost
      );

      if (result.success) {
        toast.success(`Stock ${mode === "add" ? "added" : "deducted"}`);
        router.push("/inventory");
      } else {
        toast.error(result.message || "Failed to update stock");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
      <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Material</span>
          <span className="font-semibold">{material.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current stock</span>
          <span className="font-semibold">{currentStock.toFixed(2)} {material.unit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cost/unit</span>
          <span className="font-semibold">K{currentCost.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <Label htmlFor="quantity">Quantity ({material.unit}) *</Label>
        <Input
          id="quantity"
          type="number"
          step="0.01"
          {...register("quantity", {
            required: "Quantity is required",
            min: { value: 0.01, message: "Quantity must be positive" },
          })}
          placeholder="0"
          disabled={isPending}
        />
        {errors.quantity && (
          <p className="text-sm text-red-600 mt-1">{errors.quantity.message}</p>
        )}
      </div>

      {mode === "add" && (
        <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
          <p className="text-sm font-medium">Price</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                {...register("useSamePrice")}
                value="true"
                checked={String(useSamePrice) === "true"}
                onChange={() => (register("useSamePrice").onChange as any)({ target: { value: true } })}
                disabled={isPending}
              />
              <span className="text-sm">Same price (K{currentCost.toFixed(2)})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                {...register("useSamePrice")}
                value="false"
                checked={String(useSamePrice) === "false"}
                onChange={() => (register("useSamePrice").onChange as any)({ target: { value: false } })}
                disabled={isPending}
              />
              <span className="text-sm">New price</span>
            </label>
          </div>

          {String(useSamePrice) === "false" && (
            <Input
              type="number"
              step="0.01"
              {...register("newPrice")}
              placeholder="Enter new unit cost"
              disabled={isPending}
            />
          )}

          {String(useSamePrice) === "false" && newPrice && Number(newPrice) !== currentCost && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Current value:</span>
                <span className="font-mono">K{(currentStock * currentCost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>New stock value:</span>
                <span className="font-mono">K{(Number(quantity) * Number(newPrice)).toFixed(2)}</span>
              </div>
              <div className="border-t pt-1 flex justify-between font-semibold text-blue-700">
                <span>New weighted avg:</span>
                <span className="font-mono">K{weightedAvgCost.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg bg-muted/30 border border-border p-3 text-sm">
        <div className="flex justify-between mb-1 text-muted-foreground">
          <span>Current stock:</span>
          <span className="font-mono">{currentStock.toFixed(2)}</span>
        </div>
        <div className={`flex justify-between font-semibold ${mode === "deduct" && newStock < 0 ? "text-red-600" : "text-primary"}`}>
          <span>After update:</span>
          <span className="font-mono">{newStock.toFixed(2)} {material.unit}</span>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          {...register("notes")}
          placeholder={mode === "add" ? "e.g., Purchase order #123" : "e.g., Used for batch #456"}
          className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
          rows={2}
          disabled={isPending}
        />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/inventory")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isPending} disabled={!Number(quantity)}>
          {mode === "add" ? "Restock" : "Deduct Stock"}
        </Button>
      </div>
    </form>
  );
}
