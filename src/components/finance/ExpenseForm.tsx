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
import { addExpense, updateExpense } from "@/app/actions/finance";

const EXPENSE_CATEGORIES = ["Materials", "Labor", "Utilities", "Rent", "Transport", "Marketing", "Other"];
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Mobile Money"];

interface ExpenseFormProps {
  expense?: any;
}

type FormData = {
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  notes: string;
};

export default function ExpenseForm({ expense }: ExpenseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    defaultValues: expense
      ? {
          expense_date: expense.expense_date,
          category: expense.category || "",
          description: expense.description || "",
          amount: parseFloat(String(expense.amount || 0)),
          payment_method: expense.payment_method || "",
          notes: expense.notes || "",
        }
      : {
          expense_date: format(new Date(), "yyyy-MM-dd"),
          category: "",
          description: "",
          amount: 0,
          payment_method: "",
          notes: "",
        },
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const payload = { ...data, amount: parseFloat(String(data.amount)) };
      const result = expense
        ? await updateExpense(expense.id, payload)
        : await addExpense(payload);

      if (result.success) {
        toast.success(expense ? "Expense updated" : "Expense added");
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
          <Label htmlFor="expense_date">Date *</Label>
          <Input id="expense_date" type="date" {...register("expense_date", { required: true })} disabled={isPending} />
        </div>
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
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          {...register("description", { required: "Description is required" })}
          placeholder="What was this expense for?"
          disabled={isPending}
        />
        {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          {...register("notes")}
          placeholder="Additional notes"
          className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
          rows={3}
          disabled={isPending}
        />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.push("/finance")} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          {expense ? "Update Expense" : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}
