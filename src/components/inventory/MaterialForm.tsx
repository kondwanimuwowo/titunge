"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { Tables, TablesInsert } from "@/lib/types/database";
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
import { addMaterialAction, updateMaterialAction } from "@/app/actions/inventory";

const CATEGORIES = [
  "Cotton", "Polyester", "Silk", "Wool", "Linen", "Denim",
  "Fabric", "Chitenge/Ankara Print", "Lace", "Interfacing/Lining", "Trim/Embellishments",
  "Elastic", "Thread", "Buttons", "Zippers", "Industrial",
];
const UNITS = ["Meters", "Kilograms", "Pieces", "Reels", "Boxes", "Packs", "Sheets"];

interface MaterialFormProps {
  material?: Tables<"materials"> | null;
}

type FormData = TablesInsert<"materials">;

export default function MaterialForm({ material }: MaterialFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    defaultValues: material
      ? {
          name: material.name,
          category: material.category,
          unit: material.unit,
          stock_quantity: material.stock_quantity,
          min_stock_level: material.min_stock_level,
          cost_per_unit: material.cost_per_unit,
          supplier: material.supplier || "",
          description: material.description || "",
        }
      : {
          stock_quantity: 0,
          min_stock_level: 0,
          cost_per_unit: 0,
        },
  });

  const selectedCategory = watch("category");
  const selectedUnit = watch("unit");

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const result = material
        ? await updateMaterialAction(material.id, data)
        : await addMaterialAction(data);

      if (result.success) {
        toast.success(material ? "Material updated" : "Material added");
        router.push("/inventory");
      } else {
        toast.error(result.message || "Failed to save");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div>
        <Label htmlFor="name">Material Name *</Label>
        <Input
          id="name"
          {...register("name", { required: "Name is required" })}
          placeholder="e.g., Premium Cotton Fabric"
          disabled={isPending}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={selectedCategory || ""}
            onValueChange={(value) => setValue("category", value)}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="unit">Unit *</Label>
          <Select
            value={selectedUnit || ""}
            onValueChange={(value) => setValue("unit", value)}
          >
            <SelectTrigger id="unit">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stock">Stock Quantity *</Label>
          <Input
            id="stock"
            type="number"
            step="0.01"
            {...register("stock_quantity", { required: true })}
            placeholder="0"
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="minLevel">Minimum Level *</Label>
          <Input
            id="minLevel"
            type="number"
            step="0.01"
            {...register("min_stock_level", { required: true })}
            placeholder="0"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cost">Cost per Unit (K) *</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          {...register("cost_per_unit", { required: true })}
          placeholder="0.00"
          disabled={isPending}
        />
      </div>

      <div>
        <Label htmlFor="supplier">Supplier</Label>
        <Input
          id="supplier"
          {...register("supplier")}
          placeholder="Supplier name"
          disabled={isPending}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register("description")}
          placeholder="Additional notes"
          className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
          rows={3}
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
        <Button type="submit" loading={isPending}>
          {material ? "Update Material" : "Add Material"}
        </Button>
      </div>
    </form>
  );
}
