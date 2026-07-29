"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/app/actions/profile";
import ChangePasswordForm from "./ChangePasswordForm";

interface ProfileFormProps {
  profile: {
    full_name?: string;
    email?: string;
    role?: string;
    created_at?: string;
  } | null;
}

type FormValues = {
  full_name: string;
};

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      full_name: profile?.full_name ?? "",
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await updateProfile({ full_name: data.full_name });
      if (result.success) {
        toast.success("Profile updated successfully");
      } else {
        toast.error(`Failed to update profile: ${result.message}`);
      }
    });
  };

  return (
    <div className="space-y-6">
    <div className="bg-card border rounded-lg p-6 space-y-4 max-w-lg">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Edit Profile
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update your display name. Contact an admin to change your role or
          email.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {/* Editable: Full Name */}
        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="full_name">Full Name</Label>
          {/* @ts-ignore */}
          <Input
            id="full_name"
            type="text"
            placeholder="Your full name"
            {...register("full_name", { required: "Full name is required" })}
          />
          {errors.full_name && (
            <p className="text-xs text-destructive">
              {errors.full_name.message}
            </p>
          )}
        </div>

        {/* Read-only: Email */}
        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="email" className="text-muted-foreground">
            Email
          </Label>
          {/* @ts-ignore */}
          <Input
            id="email"
            type="email"
            value={profile?.email ?? "—"}
            disabled
            className="bg-muted/50 cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Email is managed through authentication and cannot be changed here.
          </p>
        </div>

        {/* Read-only: Role */}
        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="role" className="text-muted-foreground">
            Role
          </Label>
          {/* @ts-ignore */}
          <Input
            id="role"
            type="text"
            value={
              profile?.role
                ? String(profile.role).charAt(0).toUpperCase() +
                  String(profile.role).slice(1)
                : "—"
            }
            disabled
            className="bg-muted/50 cursor-not-allowed capitalize"
          />
          <p className="text-xs text-muted-foreground">
            Role is assigned by an admin.
          </p>
        </div>

        {/* Read-only: Member Since */}
        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="member_since" className="text-muted-foreground">
            Member Since
          </Label>
          {/* @ts-ignore */}
          <Input
            id="member_since"
            type="text"
            value={
              profile?.created_at
                ? format(new Date(profile.created_at), "MMMM d, yyyy")
                : "—"
            }
            disabled
            className="bg-muted/50 cursor-not-allowed"
          />
        </div>

        <div className="pt-2">
          {/* @ts-ignore */}
          <Button type="submit" loading={isPending} className="gap-2">
            {!isPending && <Save className="h-4 w-4" />}
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>

    <ChangePasswordForm />
    </div>
  );
}
