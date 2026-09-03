"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlatformSettingsAction } from "@/app/actions/platform-settings";
import type { Tables } from "@/lib/types/database";

interface PlatformSettingsFormProps {
  settings: Tables<"platform_settings"> | null;
}

type FormValues = {
  commission_rate: number;
  payout_release_window_hours: number;
  max_payout_retries: number;
  seat_price_kwacha: number;
};

export default function PlatformSettingsForm({ settings }: PlatformSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      commission_rate: settings ? settings.commission_rate * 100 : 10,
      payout_release_window_hours: settings?.payout_release_window_hours ?? 24,
      max_payout_retries: settings?.max_payout_retries ?? 3,
      seat_price_kwacha: settings?.seat_price_kwacha ?? 250,
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await updatePlatformSettingsAction({
        commission_rate: Number(data.commission_rate) / 100,
        payout_release_window_hours: Number(data.payout_release_window_hours),
        max_payout_retries: Number(data.max_payout_retries),
        seat_price_kwacha: Number(data.seat_price_kwacha),
      });

      if (result.success) {
        toast.success("Platform settings saved");
      } else {
        toast.error(`Failed to save: ${result.message}`);
      }
    });
  };

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Marketplace &amp; billing</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Controls the commission taken on marketplace sales, when sellers get paid, and the Team-plan seat price.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="commission_rate">Marketplace commission rate (%)</Label>
          {/* @ts-ignore */}
          <Input
            id="commission_rate"
            type="number"
            step="0.1"
            min="0"
            max="100"
            {...register("commission_rate", { required: true, min: 0, max: 100, valueAsNumber: true })}
          />
          {errors.commission_rate && (
            <p className="text-xs text-destructive">Please enter a rate between 0 and 100.</p>
          )}
        </div>

        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="payout_release_window_hours">Payout release window (hours after delivery)</Label>
          {/* @ts-ignore */}
          <Input
            id="payout_release_window_hours"
            type="number"
            step="1"
            min="0"
            {...register("payout_release_window_hours", { required: true, min: 0, valueAsNumber: true })}
          />
          {errors.payout_release_window_hours && (
            <p className="text-xs text-destructive">Please enter a valid number of hours.</p>
          )}
        </div>

        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="max_payout_retries">Max payout retry attempts</Label>
          {/* @ts-ignore */}
          <Input
            id="max_payout_retries"
            type="number"
            step="1"
            min="0"
            {...register("max_payout_retries", { required: true, min: 0, valueAsNumber: true })}
          />
        </div>

        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="seat_price_kwacha">Team plan seat price (K / additional user / month)</Label>
          {/* @ts-ignore */}
          <Input
            id="seat_price_kwacha"
            type="number"
            step="1"
            min="0"
            {...register("seat_price_kwacha", { required: true, min: 0, valueAsNumber: true })}
          />
        </div>

        <div className="pt-2">
          {/* @ts-ignore */}
          <Button type="submit" loading={isPending} className="gap-2">
            {!isPending && <Save className="h-4 w-4" />}
            {isPending ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
