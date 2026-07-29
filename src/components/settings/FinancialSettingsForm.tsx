"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFinancialSettings } from "@/app/actions/settings";

interface FinancialSettingsFormProps {
  settings: {
    custom_hourly_rate?: number;
    default_profit_margin?: number;
    expected_monthly_orders?: number;
    tax_rate?: number;
  } | null;
}

type FormValues = {
  custom_hourly_rate: number;
  default_profit_margin: number;
  expected_monthly_orders: number;
  tax_rate: number;
};

export default function FinancialSettingsForm({
  settings,
}: FinancialSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      custom_hourly_rate: settings?.custom_hourly_rate ?? 0,
      default_profit_margin: settings?.default_profit_margin ?? 0,
      expected_monthly_orders: settings?.expected_monthly_orders ?? 0,
      tax_rate: settings?.tax_rate ?? 0,
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await updateFinancialSettings({
        custom_hourly_rate: Number(data.custom_hourly_rate),
        default_profit_margin: Number(data.default_profit_margin),
        expected_monthly_orders: Number(data.expected_monthly_orders),
        tax_rate: Number(data.tax_rate),
      });

      if (result.success) {
        toast.success("Settings saved successfully");
      } else {
        toast.error(`Failed to save settings: ${result.message}`);
      }
    });
  };

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4 max-w-lg">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Financial Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure pricing, margins, and tax defaults used across the system.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="custom_hourly_rate">Custom Hourly Rate (K)</Label>
          {/* @ts-ignore */}
          <Input
            id="custom_hourly_rate"
            type="number"
            step="0.01"
            min="0"
            {...register("custom_hourly_rate", { required: true, min: 0 })}
          />
          {errors.custom_hourly_rate && (
            <p className="text-xs text-destructive">
              Please enter a valid hourly rate.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="default_profit_margin">
            Default Profit Margin (%)
          </Label>
          {/* @ts-ignore */}
          <Input
            id="default_profit_margin"
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register("default_profit_margin", {
              required: true,
              min: 0,
              max: 100,
            })}
          />
          {errors.default_profit_margin && (
            <p className="text-xs text-destructive">
              Please enter a valid profit margin between 0 and 100.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="expected_monthly_orders">
            Expected Monthly Orders
          </Label>
          {/* @ts-ignore */}
          <Input
            id="expected_monthly_orders"
            type="number"
            step="1"
            min="0"
            {...register("expected_monthly_orders", {
              required: true,
              min: 0,
              valueAsNumber: true,
            })}
          />
          {errors.expected_monthly_orders && (
            <p className="text-xs text-destructive">
              Please enter a valid number of orders.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          {/* @ts-ignore */}
          <Label htmlFor="tax_rate">Tax Rate (%)</Label>
          {/* @ts-ignore */}
          <Input
            id="tax_rate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register("tax_rate", { required: true, min: 0, max: 100 })}
          />
          {errors.tax_rate && (
            <p className="text-xs text-destructive">
              Please enter a valid tax rate between 0 and 100.
            </p>
          )}
        </div>

        <div className="pt-2">
          {/* @ts-ignore */}
          <Button type="submit" loading={isPending} className="gap-2">
            {!isPending && <Save className="h-4 w-4" />}
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
