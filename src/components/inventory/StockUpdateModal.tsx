"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Tables } from "@/lib/types/database";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface StockUpdateModalProps {
  material: Tables<"materials">;
  mode: "add" | "deduct";
  onClose: () => void;
  onSubmit: (
    materialId: string,
    quantity: number,
    mode: "add" | "deduct",
    notes: string,
    unitCost?: number
  ) => void;
  isPending: boolean;
}

interface FormData {
  quantity: number;
  notes: string;
  newPrice?: number;
  useSamePrice: boolean;
}

export default function StockUpdateModal({
  material,
  mode,
  onClose,
  onSubmit,
  isPending,
}: StockUpdateModalProps) {
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

  // Calculate new stock and weighted average cost
  const newStock = mode === "add" ? currentStock + quantity : currentStock - quantity;

  let weightedAvgCost = currentCost;
  if (mode === "add" && !useSamePrice && newPrice && newPrice !== currentCost) {
    const currentValue = currentStock * currentCost;
    const newStockValue = quantity * newPrice;
    weightedAvgCost = (currentValue + newStockValue) / newStock;
  }

  const onFormSubmit = (data: FormData) => {
    const unitCost = useSamePrice ? currentCost : (newPrice || currentCost);
    onSubmit(material.id, data.quantity, mode, data.notes, unitCost);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Restock" : "Use Stock"} - {material.name}
          </DialogTitle>
          <DialogDescription>
            Current stock: <span className="font-semibold">{currentStock.toFixed(2)} {material.unit}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">Quantity ({material.unit}) *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              {...register("quantity", {
                required: "Quantity is required",
                min: { value: 0, message: "Quantity must be positive" },
              })}
              placeholder="0"
              disabled={isPending}
            />
            {errors.quantity && (
              <p className="text-sm text-red-600 mt-1">{errors.quantity.message}</p>
            )}
          </div>

          {/* Price section - only show for add mode */}
          {mode === "add" && (
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    {...register("useSamePrice")}
                    value="true"
                    checked={useSamePrice}
                    disabled={isPending}
                  />
                  <span className="text-sm font-medium">Same price (K{currentCost.toFixed(2)})</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    {...register("useSamePrice")}
                    value="false"
                    checked={!useSamePrice}
                    disabled={isPending}
                  />
                  <span className="text-sm font-medium">New price</span>
                </label>
              </div>

              {!useSamePrice && (
                <Input
                  type="number"
                  step="0.01"
                  {...register("newPrice")}
                  placeholder="Enter new unit cost"
                  disabled={isPending}
                  className="ml-6"
                />
              )}

              {/* Preview */}
              {!useSamePrice && newPrice && newPrice !== currentCost && (
                <Card className="mt-3 p-3 bg-blue-50 border-blue-200">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Current value:</span>
                      <span className="font-mono">K{(currentStock * currentCost).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New stock value:</span>
                      <span className="font-mono">K{(quantity * newPrice).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-1 flex justify-between font-semibold">
                      <span>New weighted average:</span>
                      <span className="font-mono text-blue-600">K{weightedAvgCost.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* New stock preview */}
          <Card className="p-3 bg-gray-50 border-gray-200">
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Current stock:</span>
                <span className="font-mono font-semibold">{currentStock.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-600 font-semibold">
                <span>New stock:</span>
                <span className="font-mono">{newStock.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              {...register("notes")}
              placeholder="e.g., Purchase order #123, damaged batch, etc."
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={2}
              disabled={isPending}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending} disabled={!quantity}>
              {isPending ? "Updating..." : "Confirm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
