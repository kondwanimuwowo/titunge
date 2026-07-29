"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { Tables } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addCustomerAction,
  updateCustomerAction,
  findCustomerByPhoneAction,
} from "@/app/actions/customers";

interface CustomerFormProps {
  customer?: Tables<"customers"> | null;
}

type FormData = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export default function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: customer?.name || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      address: customer?.address || "",
      notes: customer?.notes || "",
    },
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      if (data.phone) {
        const existing = await findCustomerByPhoneAction(data.phone, customer?.id);
        if (existing) {
          const proceed = window.confirm(
            `A customer named "${existing.name}" already has this phone number. Continue anyway?`
          );
          if (!proceed) return;
        }
      }

      const result = customer
        ? await updateCustomerAction(customer.id, data)
        : await addCustomerAction(data);

      if (result.success) {
        toast.success(customer ? "Customer updated" : "Customer added");
        router.push(customer ? `/customers/${customer.id}` : "/customers");
      } else {
        toast.error(result.message || "Failed to save");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div>
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          {...register("name", { required: "Name is required" })}
          placeholder="Jane Mwale"
          disabled={isPending}
        />
        {errors.name?.message && (
          <p className="text-sm text-red-600 mt-1">{String(errors.name.message)}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="+260..."
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="jane@example.com"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          {...register("address")}
          placeholder="Plot 123, Lusaka"
          disabled={isPending}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          {...register("notes")}
          placeholder="Preferences, style notes, anything worth remembering..."
          className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background"
          rows={3}
          disabled={isPending}
        />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/customers")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          {customer ? "Update Customer" : "Add Customer"}
        </Button>
      </div>
    </form>
  );
}
