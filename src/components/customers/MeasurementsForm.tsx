"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Ruler, Loader2 } from "lucide-react";

const BODY_FIELDS = [
  { name: "full_length", label: "Full Length" },
  { name: "shoulder", label: "Shoulder" },
  { name: "around_shoulder", label: "Around Shoulder" },
  { name: "shoulder_waist", label: "Shoulder to Waist" },
  { name: "natural_waist", label: "Natural Waist" },
  { name: "waist", label: "Waist" },
  { name: "lower_waist", label: "Lower Waist" },
  { name: "bust", label: "Bust / Chest" },
  { name: "upper_bust", label: "Upper Bust" },
  { name: "bust_point", label: "Bust Point" },
  { name: "cup", label: "Cup" },
  { name: "hip", label: "Hip" },
  { name: "nw_knee", label: "NW – Knee" },
  { name: "nw_floor", label: "NW – Floor" },
  { name: "sleeve_length", label: "Sleeve Length" },
  { name: "arm", label: "Arm" },
  { name: "cuff", label: "Cuff" },
  { name: "low_neck", label: "Low Neck" },
  { name: "low_back", label: "Low Back" },
  { name: "top_length", label: "Top Length" },
];

const TROUSER_FIELDS = [
  { name: "trouser_length", label: "Length" },
  { name: "trouser_waist", label: "Waist" },
  { name: "trouser_hip", label: "Hip" },
  { name: "rise", label: "Rise" },
  { name: "upper_thigh", label: "Upper Thigh" },
  { name: "lower_thigh", label: "Lower Thigh" },
  { name: "leg_calf", label: "Leg / Calf" },
  { name: "bottom", label: "Bottom" },
];

function MeasurementField({ field, register, errors }: { field: { name: string; label: string }; register: any; errors: any }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.name} className="flex gap-1.5 items-baseline">
        <span className="font-semibold text-foreground text-sm">{field.label}</span>
        <span className="text-xs text-muted-foreground uppercase">in</span>
      </Label>
      <Input
        id={field.name}
        type="number"
        step="0.1"
        placeholder="0.0"
        {...register(field.name, { min: { value: 0, message: "Must be positive" } })}
        className={errors[field.name] ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {errors[field.name] && (
        <p className="text-xs text-destructive font-medium">{(errors[field.name] as any)?.message}</p>
      )}
    </div>
  );
}

export default function MeasurementsForm({ customer, onSubmit, onCancel }: any) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: customer?.measurements || {},
  });

  const handleFormSubmit = (data: any) => {
    startTransition(async () => {
      const measurements = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== "" && v !== null)
      );
      await onSubmit(measurements);
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Ruler className="text-primary flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-muted-foreground">
            All measurements in inches. Take over undergarments for accuracy. Leave fields blank if not applicable.
          </p>
        </div>
      </div>

      {/* Body Measurements */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Body Measurements
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {BODY_FIELDS.map((field) => (
            <MeasurementField key={field.name} field={field} register={register} errors={errors} />
          ))}
        </div>
      </div>

      {/* Trousers */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
          Trousers
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {TROUSER_FIELDS.map((field) => (
            <MeasurementField key={field.name} field={field} register={register} errors={errors} />
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="font-semibold">Body Shape &amp; Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          className="resize-none"
          placeholder="Any special notes about measurements, body shape, preferences, etc."
          {...register("notes")}
        />
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-border">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Measurements
        </Button>
      </div>
    </form>
  );
}
