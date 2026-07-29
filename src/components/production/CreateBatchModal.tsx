"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
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
import { createBatchAction } from "@/app/actions/production";
import { getProducts } from "@/lib/data/products";
import { getMaterials } from "@/lib/data/inventory";
import { X } from "lucide-react";

interface CreateBatchModalProps {
  onClose: () => void;
  products: any[];
  materials: any[];
}

interface FormData {
  product_id: string;
  quantity: number;
  labor_cost: number;
  batch_number: string;
}

export default function CreateBatchModal({
  onClose,
  products,
  materials,
}: CreateBatchModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedMaterials, setSelectedMaterials] = useState<
    Array<{ material_id: string; quantity: number; cost: number }>
  >([]);
  const [addingMaterial, setAddingMaterial] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      batch_number: `BATCH-${Date.now()}`,
      quantity: 1,
      labor_cost: 0,
    },
  });

  const selectedProductId = watch("product_id");

  const onSubmit = (data: FormData) => {
    if (!data.product_id) {
      toast.error("Please select a product");
      return;
    }

    const batchPayload = {
      batch_number: data.batch_number,
      product_id: data.product_id,
      quantity: data.quantity,
      status: "cutting",
      labor_cost: data.labor_cost,
      started_at: new Date().toISOString(),
    };

    startTransition(async () => {
      const result = await createBatchAction(batchPayload, selectedMaterials);
      if (result.success) {
        toast.success("Batch created");
        router.refresh();
        onClose();
      } else {
        toast.error(result.message || "Failed to create batch");
      }
    });
  };

  const addMaterialSelection = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId);
    if (material) {
      setSelectedMaterials([
        ...selectedMaterials,
        {
          material_id: materialId,
          quantity: 0,
          cost: parseFloat(String(material.cost_per_unit || 0)),
        },
      ]);
      setAddingMaterial(false);
    }
  };

  const removeMaterial = (index: number) => {
    setSelectedMaterials(selectedMaterials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    const updated = [...selectedMaterials];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedMaterials(updated);
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Batch</DialogTitle>
          <DialogDescription>Set up a new production batch with materials</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Batch Number */}
          <div>
            <Label htmlFor="batchNumber">Batch Number *</Label>
            <Input
              id="batchNumber"
              {...register("batch_number", { required: "Required" })}
              disabled={isPending}
            />
          </div>

          {/* Product Selection */}
          <div>
            <Label htmlFor="product">Product *</Label>
            <select
              id="product"
              {...register("product_id", { required: "Select a product" })}
              className="w-full px-3 py-2 border rounded-md text-sm"
              disabled={isPending}
            >
              <option value="">-- Select Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (K{parseFloat(String(p.base_price || 0)).toFixed(2)})
                </option>
              ))}
            </select>
            {errors.product_id && (
              <p className="text-sm text-red-600 mt-1">{errors.product_id.message}</p>
            )}
          </div>

          {/* Quantity and Labor Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                {...register("quantity", { required: true, min: 1 })}
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="laborCost">Labor Cost (K)</Label>
              <Input
                id="laborCost"
                type="number"
                step="0.01"
                {...register("labor_cost")}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Materials */}
          <div className="border-t pt-4">
            <Label className="mb-2 block">Production Materials</Label>

            {selectedMaterials.length > 0 && (
              <div className="space-y-2 mb-3">
                {selectedMaterials.map((mat, idx) => {
                  const matData = materials.find((m) => m.id === mat.material_id);
                  return (
                    <div key={idx} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{matData?.name}</p>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={mat.quantity}
                          onChange={(e) =>
                            updateMaterial(idx, "quantity", parseFloat(e.target.value))
                          }
                          placeholder="Qty"
                          className="w-full px-2 py-1 text-xs border rounded"
                          disabled={isPending}
                        />
                        <p className="text-xs text-gray-500">{matData?.unit}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeMaterial(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Material */}
            {addingMaterial ? (
              <div className="flex gap-2 mb-3">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addMaterialSelection(e.target.value);
                    }
                  }}
                  className="flex-1 px-2 py-1 text-xs border rounded"
                >
                  <option value="">-- Select Material --</option>
                  {materials
                    .filter((m) => !selectedMaterials.some((sm) => sm.material_id === m.id))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (K{parseFloat(String(m.cost_per_unit || 0)).toFixed(2)})
                      </option>
                    ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAddingMaterial(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAddingMaterial(true)}
                disabled={selectedMaterials.length >= materials.length}
              >
                + Add Material
              </Button>
            )}
          </div>

          {/* Summary */}
          {selectedProduct && (
            <div className="border rounded-lg p-3 bg-muted/50 text-sm space-y-1">
              <p>
                <strong>Product:</strong> {selectedProduct.name}
              </p>
              <p>
                <strong>Materials:</strong> {selectedMaterials.length} selected
              </p>
              <p>
                <strong>Est. Labor:</strong> K{watch("labor_cost").toFixed(2)}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {isPending ? "Creating..." : "Create Batch"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
