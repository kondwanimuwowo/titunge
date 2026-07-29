"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import type { Tables } from "@/lib/types/database";
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
import { addEmployeeAction, updateEmployeeAction } from "@/app/actions/employees";

const ROLES = ["Tailor", "Cutter", "Finisher", "QC Inspector", "Supervisor", "Manager"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d][\d\s-]{6,}$/;

interface EmployeeFormProps {
  employee?: Tables<"employees"> | null;
}

export default function EmployeeForm({ employee }: EmployeeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, control, formState: { errors } } = useForm<any>({
    defaultValues: employee || { hire_date: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const payload = {
        ...data,
        email: data.email === "" ? null : data.email,
        hourly_rate: data.hourly_rate === "" || data.hourly_rate == null ? null : parseFloat(data.hourly_rate),
      };
      const result = employee
        ? await updateEmployeeAction(employee.id, payload)
        : await addEmployeeAction(payload);

      if (result.success) {
        toast.success(employee ? "Employee updated" : "Employee added");
        router.push("/employees");
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
          placeholder="John Doe"
          disabled={isPending}
        />
        {errors.name?.message && (
          <p className="text-sm text-red-600 mt-1">{String(errors.name.message)}</p>
        )}
      </div>

      <div>
        <Label htmlFor="role">Role *</Label>
        <Controller
          name="role"
          control={control}
          rules={{ required: "Role is required" }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.role?.message && (
          <p className="text-sm text-red-600 mt-1">{String(errors.role.message)}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email", {
              pattern: { value: EMAIL_PATTERN, message: "Enter a valid email address" },
            })}
            placeholder="john@example.com"
            disabled={isPending}
          />
          {errors.email?.message && (
            <p className="text-sm text-red-600 mt-1">{String(errors.email.message)}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            {...register("phone", {
              required: "Phone is required",
              pattern: { value: PHONE_PATTERN, message: "Enter a valid phone number" },
            })}
            placeholder="+260..."
            disabled={isPending}
          />
          {errors.phone?.message && (
            <p className="text-sm text-red-600 mt-1">{String(errors.phone.message)}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hireDate">Hire Date *</Label>
          <Input
            id="hireDate"
            type="date"
            {...register("hire_date", { required: "Hire date is required" })}
            disabled={isPending}
          />
          {errors.hire_date?.message && (
            <p className="text-sm text-red-600 mt-1">{String(errors.hire_date.message)}</p>
          )}
        </div>

        <div>
          <Label htmlFor="hourlyRate">Hourly Rate (K)</Label>
          <Input
            id="hourlyRate"
            type="number"
            step="0.01"
            min="0"
            {...register("hourly_rate", {
              min: { value: 0, message: "Hourly rate can't be negative" },
            })}
            placeholder="0.00"
            disabled={isPending}
          />
          {errors.hourly_rate?.message && (
            <p className="text-sm text-red-600 mt-1">{String(errors.hourly_rate.message)}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/employees")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          {employee ? "Update Employee" : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}
