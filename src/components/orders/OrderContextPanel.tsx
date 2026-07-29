"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Ruler,
  CreditCard,
  CheckCircle2,
  Edit2,
  Save,
  X,
  Package,
  History,
  AlertTriangle,
  Scissors,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateMeasurementsAction } from "@/app/actions/customers";

// ─── Measurement fields (matches MeasurementsForm.tsx) ────────────────────
const BODY_FIELDS = [
  { name: "full_length",     label: "Full Length" },
  { name: "shoulder",        label: "Shoulder" },
  { name: "around_shoulder", label: "Around Shoulder" },
  { name: "shoulder_waist",  label: "Shoulder–Waist" },
  { name: "natural_waist",   label: "Natural Waist" },
  { name: "waist",           label: "Waist" },
  { name: "lower_waist",     label: "Lower Waist" },
  { name: "bust",            label: "Bust / Chest" },
  { name: "upper_bust",      label: "Upper Bust" },
  { name: "bust_point",      label: "Bust Point" },
  { name: "cup",             label: "Cup" },
  { name: "hip",             label: "Hip" },
  { name: "nw_knee",         label: "NW – Knee" },
  { name: "nw_floor",        label: "NW – Floor" },
  { name: "sleeve_length",   label: "Sleeve Length" },
  { name: "arm",             label: "Arm" },
  { name: "cuff",            label: "Cuff" },
  { name: "low_neck",        label: "Low Neck" },
  { name: "low_back",        label: "Low Back" },
  { name: "top_length",      label: "Top Length" },
];

const TROUSER_FIELDS = [
  { name: "trouser_length", label: "Length" },
  { name: "trouser_waist",  label: "Waist" },
  { name: "trouser_hip",    label: "Hip" },
  { name: "rise",           label: "Rise" },
  { name: "upper_thigh",    label: "Upper Thigh" },
  { name: "lower_thigh",    label: "Lower Thigh" },
  { name: "leg_calf",       label: "Leg / Calf" },
  { name: "bottom",         label: "Bottom" },
];

const ALL_FIELDS = [...BODY_FIELDS, ...TROUSER_FIELDS];

// ─── Helpers ───────────────────────────────────────────────────────────────
function hasMeasurements(m: any): boolean {
  if (!m || typeof m !== "object") return false;
  return Object.entries(m).some(([k, v]) => k !== "notes" && v !== "" && v !== null && v !== undefined);
}

// ─── Measurements inline widget ────────────────────────────────────────────
function MeasurementsWidget({
  customer,
  orderId,
  readOnly = false,
}: {
  customer: any;
  orderId: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const measurements = customer?.measurements || {};
  const hasData = hasMeasurements(measurements);
  const [editing, setEditing] = useState(!hasData && !readOnly);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: measurements,
  });

  const onSave = (data: any) => {
    startTransition(async () => {
      const cleaned = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== "" && v !== null && v !== undefined)
      );
      const result = await updateMeasurementsAction(customer.id, cleaned, orderId);
      if (result.success) {
        toast.success("Measurements saved");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(result.message || "Failed to save");
      }
    });
  };

  const onCancel = () => {
    reset(measurements);
    setEditing(false);
  };

  if (readOnly && !hasData) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No measurements on file. Enter them at the Measurements stage.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {!hasData && !readOnly && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          No measurements on file — enter them now to proceed to production.
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          {[
            { title: "Body", fields: BODY_FIELDS },
            { title: "Trousers", fields: TROUSER_FIELDS },
          ].map((section) => (
            <div key={section.title} className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-1">
                {section.title}
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {section.fields.map((f) => (
                  <div key={f.name}>
                    <label className="text-xs text-muted-foreground mb-0.5 block">{f.label}</label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="—"
                        {...register(f.name)}
                        className="h-8 text-sm pr-7"
                        disabled={isPending}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                        in
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="text-xs text-muted-foreground mb-0.5 block">Notes</label>
            <textarea
              {...register("notes")}
              rows={2}
              placeholder="Body shape, preferences..."
              className="w-full text-sm px-2 py-1.5 border border-input rounded-md bg-background resize-none"
              disabled={isPending}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={isPending} className="flex-1 gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
            {hasData && (
              <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isPending}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {ALL_FIELDS.filter((f) => measurements[f.name]).map((f) => (
              <div key={f.name} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{f.label}</span>
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {parseFloat(String(measurements[f.name])).toFixed(1)}"
                </span>
              </div>
            ))}
          </div>
          {measurements.notes && (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 italic">
              {measurements.notes}
            </p>
          )}
          {!readOnly && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              className="w-full gap-1.5 h-8"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Measurements
            </Button>
          )}
          {readOnly && (
            <Link href={`/customers/${customer.id}`}>
              <Button size="sm" variant="outline" className="w-full gap-1.5 h-8">
                <Ruler className="h-3.5 w-3.5" />
                View Full Profile
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Activity log ──────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  enquiry: "Enquiry",
  contacted: "Contacted",
  measurements: "Measurements",
  production: "Production",
  fitting: "Fitting",
  completed: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_DOT: Record<string, string> = {
  enquiry:      "bg-slate-400",
  contacted:    "bg-blue-400",
  measurements: "bg-amber-400",
  production:   "bg-orange-500",
  fitting:      "bg-purple-400",
  completed:    "bg-emerald-500",
  delivered:    "bg-emerald-700",
  cancelled:    "bg-red-400",
};

function ActivityLog({ timeline }: { timeline: any[] }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="space-y-2">
      {timeline.map((entry: any, i: number) => (
        <div key={entry.id || i} className="flex items-start gap-2.5">
          <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", STATUS_DOT[entry.status] || "bg-muted-foreground")} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-foreground">
                {STATUS_LABELS[entry.status] || entry.status}
              </span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {entry.created_at ? format(new Date(entry.created_at), "dd MMM, HH:mm") : ""}
              </span>
            </div>
            {entry.notes && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{entry.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main panel ────────────────────────────────────────────────────────────
interface OrderContextPanelProps {
  order: any;
}

export default function OrderContextPanel({ order }: OrderContextPanelProps) {
  const status = order.status;
  const customer = order.customers;
  const measurements = customer?.measurements;
  const hasM = hasMeasurements(measurements);
  const balance = parseFloat(String(order.balance || 0));
  const showMeasurements = status === "measurements" || status === "fitting";
  const showMaterials = status === "production";
  const showPaymentPrompt = (status === "completed" || status === "delivered") && balance > 0;

  return (
    <div className="space-y-4">
      {/* ── Measurements ─────────────────────────────────────────────── */}
      {showMeasurements && customer && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">
                {status === "fitting" ? "Measurements Reference" : "Customer Measurements"}
              </span>
            </div>
            {hasM && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                On file
              </span>
            )}
            {!hasM && (
              <span className="text-xs text-amber-600 font-medium">Required</span>
            )}
          </div>
          <div className="p-4">
            <MeasurementsWidget
              customer={customer}
              orderId={order.id}
              readOnly={status === "fitting"}
            />
          </div>
        </div>
      )}

      {/* ── Materials confirmation ────────────────────────────────────── */}
      {showMaterials && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Materials in Production</span>
          </div>
          <div className="p-4 space-y-2">
            {order.materials && order.materials.length > 0 ? (
              <>
                {order.materials.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="text-foreground">{item.materials?.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {parseFloat(String(item.quantity_used)).toFixed(2)} {item.materials?.unit}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1 border-t border-border mt-2">
                  Stock deducted when order moved to production.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">No materials assigned to this order.</p>
            )}
            {order.employees && (
              <div className="flex items-center gap-2 pt-2 border-t border-border text-sm text-muted-foreground">
                <Scissors className="h-3.5 w-3.5" />
                Assigned to <span className="font-semibold text-foreground">{order.employees.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Payment prompt ────────────────────────────────────────────── */}
      {showPaymentPrompt && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200">
            <CreditCard className="h-4 w-4 text-amber-700" />
            <span className="text-sm font-semibold text-amber-800">Balance Outstanding</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-700">Amount due</span>
              <span className="text-xl font-black text-amber-800 tabular-nums">
                K{balance.toFixed(2)}
              </span>
            </div>
            <Link href={`/finance/payments/new?order_id=${order.id}`}>
              <Button size="sm" className="w-full gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Record Payment
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Activity log ─────────────────────────────────────────────── */}
      {order.timeline && order.timeline.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Activity Log</span>
          </div>
          <div className="p-4">
            <ActivityLog timeline={order.timeline} />
          </div>
        </div>
      )}
    </div>
  );
}
