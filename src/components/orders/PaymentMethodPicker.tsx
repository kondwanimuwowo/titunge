"use client";

import { cn } from "@/lib/utils";
import { PAYMENT_METHODS, type PaymentMethod } from "@/data/payment-methods";

/** Segmented choice of how a customer paid. */
export function PaymentMethodPicker({
  value,
  onChange,
  label = "Paid by",
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  label?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5" role="radiogroup" aria-label={label}>
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method}
            type="button"
            role="radio"
            aria-checked={value === method}
            onClick={() => onChange(method)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              value === method ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {method}
          </button>
        ))}
      </div>
    </div>
  );
}
