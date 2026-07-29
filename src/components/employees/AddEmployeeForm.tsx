"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
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
import {
  addEmployeeAction,
  updateEmployeeAction,
} from "@/app/actions/employees";

const ROLES = ["Tailor", "Cutter", "Finisher", "QC Inspector", "Supervisor", "Manager"];

interface AddEmployeeFormProps {
  employee?: Tables<"employees"> | null;
  onClose: () => void;
}

export default function AddEmployeeForm({ employee, onClose }: AddEmployeeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    defaultValues: employee || {},
  });

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const result = employee
        ? await updateEmployeeAction(employee.id, data)
        : await addEmployeeAction(data);

      if (result.success) {
        toast.success(employee ? "Employee updated" : "Employee added");
        router.refresh();
        onClose();
      } else {
        toast.error(result.message || "Failed to save");
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add Employee"}</DialogTitle>
          <DialogDescription>
            {employee ? "Update employee details" : "Hire a new team member"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              {...register("name", { required: "Name is required" })}
              placeholder="John Doe"
              disabled={isPending}
            />
            {errors.name?.message && <p className="text-sm text-red-600 mt-1">{String(errors.name.message)}</p>}
          </div>

          <div>
            <Label htmlFor="role">Role *</Label>
            <select
              id="role"
              {...register("role", { required: "Role is required" })}
              className="w-full px-3 py-2 border rounded-md text-sm"
              disabled={isPending}
            >
              <option value="">Select role</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john@example.com"
                disabled={isPending}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                {...register("phone", { required: "Phone is required" })}
                placeholder="+260..."
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input
                id="hireDate"
                type="date"
                {...register("hire_date")}
                disabled={isPending}
              />
            </div>

            <div>
              <Label htmlFor="hourlyRate">Hourly Rate (K)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                {...register("hourly_rate")}
                placeholder="0.00"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {isPending ? "Saving..." : employee ? "Update" : "Add Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
