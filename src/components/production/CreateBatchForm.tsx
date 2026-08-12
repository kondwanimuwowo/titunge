"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
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
import { createBatchAction } from "@/app/actions/production";
import { X, Plus } from "lucide-react";

interface CreateBatchFormProps {
  products: any[];
  materials: any[];
}

interface FormData {
  product_id: string;
  quantity: number;
  labor_cost: number;
  batch_number: string;
}

export default function CreateBatchForm({ products, materials }: CreateBatchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedMaterials, setSelectedMaterials] = useState<
    Array<{ material_id: string; quantity: number; cost: number }>
  >([]);
  const [addingMaterial, setAddingMaterial] = useState(false);

  const { register, handleSubmit, control, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      batch_number: `BATCH-${Date.now()}`,
      quantity: 1,
      labor_cost: 0,
    },
  });

  const selectedProductId = watch("product_id");
  const selectedProduct = products.find((p) => p.id === selectedProductId);

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
        router.push("/production");
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

  const updateMaterialQty = (index: number, value: number) => {
    const updated = [...selectedMaterials];
    updated[index] = { ...updated[index], quantity: value };
    setSelectedMaterials(updated);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div>
        <Label htmlFor="batchNumber">Batch Number *</Label>
        <Input
          id="batchNumber"
          {...register("batch_number", { required: "Required" })}
          disabled={isPending}
        />
      </div>

      <div>
        <Label htmlFor="product">Product *</Label>
        <Controller
          name="product_id"
          control={control}
          rules={{ required: "Select a product" }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
              <SelectTrigger id="product" className="w-full">
                <SelectValue placeholder="-- Select Product --" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} (K{parseFloat(String(p.price || 0)).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.product_id && (
          <p className="text-sm text-red-600 mt-1">{errors.product_id.message}</p>
        )}
      </div>

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

      <div className="border-t pt-4">
        <Label className="mb-3 block">Production Materials</Label>

        {selectedMaterials.length > 0 && (
          <div className="space-y-2 mb-3">
            {selectedMaterials.map((mat, idx) => {
              const matData = materials.find((m) => m.id === mat.material_id);
              return (
                <div key={idx} className="flex gap-2 items-center border rounded-lg p-2">
                  <span className="flex-1 text-sm font-medium">{matData?.name}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={mat.quantity}
                      onChange={(e) => updateMaterialQty(idx, parseFloat(e.target.value))}
                      placeholder="Qty"
                      className="w-20 px-2 py-1 text-sm border border-input rounded bg-background"
                      disabled={isPending}
                    />
                    <span className="text-xs text-muted-foreground">{matData?.unit}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMaterial(idx)}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {addingMaterial ? (
          <div className="flex gap-2 mb-3">
            <Select onValueChange={(v) => addMaterialSelection(v)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="-- Select Material --" />
              </SelectTrigger>
              <SelectContent>
                {materials
                  .filter((m) => !selectedMaterials.some((sm) => sm.material_id === m.id))
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.unit}) — K{parseFloat(String(m.cost_per_unit || 0)).toFixed(2)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" variant="outline" onClick={() => setAddingMaterial(false)}>
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
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Material
          </Button>
        )}
      </div>

      {selectedProduct && (
        <div className="border rounded-lg p-3 bg-muted/30 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Product</span>
            <span className="font-semibold">{selectedProduct.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Materials</span>
            <span>{selectedMaterials.length} selected</span>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/production")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          Create Batch
        </Button>
      </div>
    </form>
  );
}
