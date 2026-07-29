"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type FormValues = {
  password: string;
  confirmPassword: string;
};

export default function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { password: "", confirmPassword: "" } });

  const password = watch("password");

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: data.password });

      if (error) {
        toast.error(error.message || "Failed to update password");
        return;
      }

      toast.success("Password updated");
      reset();
    });
  };

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4 max-w-lg">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <div>
          <h2 className="text-base font-semibold text-foreground">Change Password</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Update the password used to sign in to your account.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="password">New Password</Label>
          {/* @ts-ignore */}
          <Input
            id="password"
            type="password"
            placeholder="At least 6 characters"
            disabled={isPending}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "Must be at least 6 characters" },
            })}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          {/* @ts-ignore */}
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            disabled={isPending}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) => value === password || "Passwords do not match",
            })}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="pt-2">
          {/* @ts-ignore */}
          <Button type="submit" loading={isPending} className="gap-2">
            {!isPending && <KeyRound className="h-4 w-4" />}
            {isPending ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
