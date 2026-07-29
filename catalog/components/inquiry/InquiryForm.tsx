"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { submitInquiry } from "@/services/catalogService";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { motion } from "motion/react";

interface InquiryFormProps {
  productId: string;
  productName: string;
  onSuccess?: () => void;
}

export function InquiryForm({ productId, productName, onSuccess }: InquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    const formData = new FormData(e.currentTarget);
    const data = {
      product_id: productId,
      customer_name: formData.get("customer_name"),
      customer_phone: formData.get("customer_phone"),
      customer_email: formData.get("customer_email"),
      preferred_size: formData.get("preferred_size"),
      custom_measurements_needed: formData.get("custom_measurements_needed") === "on",
      special_requests: formData.get("special_requests"),
      contact_method: formData.get("contact_method"),
    };

    try {
      await submitInquiry(data);
      setStatus("success");
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (error) {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
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
        <h3 className="text-xl font-serif font-medium">Inquiry Sent</h3>
        <p className="text-sm text-muted-foreground font-light max-w-sm">
          Thank you for your interest in {productName}. Our team will contact you shortly via your preferred method.
        </p>
      </motion.div>
    );
  }

  const fieldClass =
    "flex h-12 w-full rounded-2xl border border-border/70 bg-white/50 px-4 text-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:border-primary appearance-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {status === "error" && (
        <div className="rounded-2xl p-3 bg-destructive/5 border border-destructive/20 text-destructive flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to submit inquiry. Please try again.</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="customer_name" className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Full Name *</label>
        <Input id="customer_name" name="customer_name" required placeholder="Jane Doe" className={fieldClass} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="customer_email" className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Email *</label>
          <Input id="customer_email" name="customer_email" type="email" required placeholder="jane@example.com" className={fieldClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="customer_phone" className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Phone *</label>
          <Input id="customer_phone" name="customer_phone" type="tel" required placeholder="+1 (555) 000-0000" className={fieldClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="preferred_size" className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Size</label>
          <select id="preferred_size" name="preferred_size" className={fieldClass}>
            <option value="">Select a size...</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
            <option value="Custom">Custom Measurements</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="contact_method" className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Contact Method</label>
          <select id="contact_method" name="contact_method" defaultValue="whatsapp" className={fieldClass}>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone Call</option>
            <option value="email">Email</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/40 px-4 py-3">
        <input
          type="checkbox"
          id="custom_measurements_needed"
          name="custom_measurements_needed"
          className="h-4 w-4 rounded border-border text-foreground focus:ring-primary accent-primary"
        />
        <label htmlFor="custom_measurements_needed" className="text-sm font-light text-muted-foreground">
          I need to come in for custom measurements
        </label>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="special_requests" className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Special Requests</label>
        <textarea
          id="special_requests"
          name="special_requests"
          rows={3}
          className="flex w-full rounded-2xl border border-border/70 bg-white/50 px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:border-primary resize-none"
          placeholder="Any specific color preferences, fabric requests, or timeline constraints?"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="pill-btn w-full justify-center bg-foreground text-background text-sm font-medium uppercase tracking-[0.15em] hover:bg-foreground/85 disabled:opacity-40 disabled:pointer-events-none mt-2"
      >
        {isSubmitting ? "Sending..." : "Submit Inquiry"}
        <span className="pill-btn-icon bg-background/15">
          <Send className="h-3.5 w-3.5" />
        </span>
      </button>
    </form>
  );
}
