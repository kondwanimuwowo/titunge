"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { format, startOfMonth } from "date-fns";
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
import { addOverheadCost, updateOverheadCost } from "@/app/actions/finance";

const OVERHEAD_CATEGORIES = ["Rent", "Utilities", "Equipment", "Insurance", "Salaries", "Internet", "Other"];

interface OverheadFormProps {
  overhead?: any;
}

type FormData = {
  category: string;
  description: string;
  amount: number;
  is_recurring: boolean;
  notes: string;
};

export default function OverheadForm({ overhead }: OverheadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    defaultValues: overhead
      ? {
          category: overhead.category || "",
          description: overhead.description || "",
          amount: parseFloat(String(overhead.amount || 0)),
          is_recurring: overhead.is_recurring || false,
          notes: overhead.notes || "",
        }
      : {
          category: "",
          description: "",
          amount: 0,
          is_recurring: false,
          notes: "",
        },
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const payload = {
        ...data,
        amount: parseFloat(String(data.amount)),
        month: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      };

      const result = overhead
        ? await updateOverheadCost(overhead.id, payload)
        : await addOverheadCost(payload);

      if (result.success) {
        toast.success(overhead ? "Overhead updated" : "Overhead cost added");
        router.push("/finance");
      } else {
        toast.error(result.message || "Failed to save");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Controller
            name="category"
            control={control}
            rules={{ required: "Category is required" }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {OVERHEAD_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>}
        </div>
        <div>
          <Label htmlFor="amount">Amount (K) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register("amount", { required: true, min: 0 })}
            placeholder="0.00"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          {...register("description", { required: "Description is required" })}
          placeholder="e.g., Monthly office rent"
          disabled={isPending}
        />
        {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
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

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...register("is_recurring")} disabled={isPending} className="rounded" />
        <span className="text-sm font-medium">Recurring monthly cost</span>
      </label>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.push("/finance")} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          {overhead ? "Update Overhead" : "Add Overhead Cost"}
        </Button>
      </div>
    </form>
  );
}
