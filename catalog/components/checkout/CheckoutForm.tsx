"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Loader2, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

declare global {
  interface Window {
    LencoPay?: {
      getPaid: (options: any) => void;
    };
  }
}

interface CheckoutFormProps {
  productId: string;
  productName: string;
  price: number;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
}

export function CheckoutForm({ productId, productName, price, onSuccess, onClose }: CheckoutFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "paying" | "verifying" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const formattedPrice = new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
  }).format(price || 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("paying");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const customerName = formData.get("customer_name") as string;
    const customerEmail = formData.get("customer_email") as string;
    const customerPhone = formData.get("customer_phone") as string;

    const reference = `gd-${productId.slice(0, 8)}-${Date.now()}`;
    const publicKey = process.env.NEXT_PUBLIC_LENCO_PUBLIC_KEY;

    if (!publicKey) {
      setStatus("error");
      setErrorMessage("Payment is not configured. Please contact the store.");
      setIsSubmitting(false);
      return;
    }

    if (!window.LencoPay) {
      setStatus("error");
      setErrorMessage("Payment system failed to load. Please refresh and try again.");
      setIsSubmitting(false);
      return;
    }

    const nameParts = customerName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    window.LencoPay.getPaid({
      key: publicKey,
      reference,
      email: customerEmail,
      amount: price,
      currency: "ZMW",
      label: `Gloriaz Daughter - ${productName}`,
      channels: ["card", "mobile-money"],
      customer: {
        firstName,
        lastName,
        phone: customerPhone,
      },
      onSuccess: async (response: { reference: string }) => {
        setStatus("verifying");
        try {
          const res = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference: response.reference,
              product_id: productId,
              customer_name: customerName,
              customer_email: customerEmail,
              customer_phone: customerPhone,
            }),
          });

          const result = await res.json();

          if (result.success) {
            setStatus("success");
            setTimeout(() => onSuccess(response.reference), 2000);
          } else {
            setStatus("error");
            setErrorMessage(result.message || "Payment verification failed. Please contact support.");
          }
        } catch {
          setStatus("error");
          setErrorMessage("Could not verify payment. Please contact support with your reference: " + response.reference);
        }
        setIsSubmitting(false);
      },
      onClose: () => {
        setStatus("idle");
        setIsSubmitting(false);
      },
      onConfirmationPending: () => {
        setStatus("verifying");
        setIsSubmitting(false);
      },
    });
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center justify-center py-10 text-center space-y-4"
      >
        <div className="h-14 w-14 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <h3 className="text-xl font-serif font-medium">Payment Successful</h3>
        <p className="text-sm text-muted-foreground font-light max-w-sm">
          Thank you for your purchase of {productName}. We&apos;ll be in touch about delivery.
        </p>
      </motion.div>
    );
  }

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h3 className="text-lg font-serif font-medium">Verifying Payment...</h3>
        <p className="text-sm text-muted-foreground font-light">
          Please wait while we confirm your payment.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Order Summary */}
      <div className="rounded-lg border border-border/50 p-4 bg-secondary/30">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">{productName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ready to Wear</p>
          </div>
          <p className="text-lg font-semibold">{formattedPrice}</p>
        </div>
      </div>

      {/* Customer Details */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Your Details
        </h4>

        <div>
          <label htmlFor="customer_name" className="text-sm font-medium mb-1.5 block">
            Full Name
          </label>
          <Input
            id="customer_name"
            name="customer_name"
            placeholder="Enter your full name"
            required
            className="text-sm"
          />
        </div>

        <div>
          <label htmlFor="customer_email" className="text-sm font-medium mb-1.5 block">
            Email Address
          </label>
          <Input
            id="customer_email"
            name="customer_email"
            type="email"
            placeholder="your@email.com"
            required
            className="text-sm"
          />
        </div>

        <div>
          <label htmlFor="customer_phone" className="text-sm font-medium mb-1.5 block">
            Phone Number
          </label>
          <Input
            id="customer_phone"
            name="customer_phone"
            type="tel"
            placeholder="e.g. 0971234567"
            required
            className="text-sm"
          />
        </div>
      </div>

      {status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 text-sm font-medium uppercase tracking-[0.15em] bg-foreground text-background px-8 py-4 hover:bg-foreground/85 transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {isSubmitting ? "Processing..." : `Pay ${formattedPrice}`}
      </button>

      <p className="text-[10px] text-center text-muted-foreground">
        Payments are securely processed by Lenco
      </p>
    </form>
  );
}
