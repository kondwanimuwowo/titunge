"use client";

import { useTransition } from "react";
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
import { addGarmentType, updateGarmentType } from "@/app/actions/finance";

const COMPLEXITY_LEVELS = ["Simple", "Medium", "Complex", "Premium"];

interface GarmentTypeFormProps {
  garmentType?: any;
}

type FormData = {
  name: string;
  description: string;
  base_labour_cost: number;
  estimated_hours: number;
  complexity: string;
};

export default function GarmentTypeForm({ garmentType }: GarmentTypeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    defaultValues: garmentType
      ? {
          name: garmentType.name || "",
          description: garmentType.description || "",
          base_labour_cost: parseFloat(String(garmentType.base_labour_cost || 0)),
          estimated_hours: parseFloat(String(garmentType.estimated_hours || 0)),
          complexity: garmentType.complexity || "Medium",
        }
      : {
          name: "",
          description: "",
          base_labour_cost: 0,
          estimated_hours: 0,
          complexity: "Medium",
        },
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const payload = {
        ...data,
        base_labour_cost: parseFloat(String(data.base_labour_cost)),
        estimated_hours: parseFloat(String(data.estimated_hours)),
      };

      const result = garmentType
        ? await updateGarmentType(garmentType.id, payload)
        : await addGarmentType(payload);

      if (result.success) {
        toast.success(garmentType ? "Garment type updated" : "Garment type added");
        router.push("/settings");
      } else {
        toast.error(result.message || "Failed to save");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register("name", { required: "Name is required" })}
          placeholder="e.g., Formal Dress"
          disabled={isPending}
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register("description")}
          placeholder="Brief description of this garment type"
          className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
          rows={2}
          disabled={isPending}
        />
      </div>

      <div>
        <Label htmlFor="complexity">Complexity *</Label>
        <Controller
          name="complexity"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
              <SelectTrigger id="complexity" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPLEXITY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="base_labour_cost">Base Labour Cost (K) *</Label>
          <Input
            id="base_labour_cost"
            type="number"
            step="0.01"
            {...register("base_labour_cost", { required: true, min: 0 })}
            placeholder="0.00"
            disabled={isPending}
          />
        </div>
        <div>
          <Label htmlFor="estimated_hours">Estimated Hours *</Label>
          <Input
            id="estimated_hours"
            type="number"
            step="0.5"
            {...register("estimated_hours", { required: true, min: 0 })}
            placeholder="0"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.push("/settings")} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          {garmentType ? "Update Garment Type" : "Add Garment Type"}
        </Button>
      </div>
    </form>
  );
}
