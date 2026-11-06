"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, MessageCircle, X } from "lucide-react";
import { createMarketplaceInquiryAction } from "@/app/actions/marketplace-inquiries";

interface AskSellerButtonProps {
  sellerName: string;
  productId?: string;
  productName?: string;
  sellerSlug?: string;
  size?: string;
  className?: string;
}

const INPUT_CLASS = "w-full text-sm border border-gray-200 rounded-md px-3 py-2.5";

export function AskSellerButton({ sellerName, productId, productName, sellerSlug, size, className }: AskSellerButtonProps) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "", website: "" });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createMarketplaceInquiryAction({ ...form, productId, sellerSlug, size });
      if (result.success) setSent(true);
      else setError(result.message ?? "Something went wrong. Please try again.");
    });
  };

  const close = () => {
    setOpen(false);
    if (sent) {
      setSent(false);
      setForm({ name: "", phone: "", email: "", message: "", website: "" });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-2 bg-gray-100 text-[#0e1a18] text-sm font-bold rounded-full px-8 py-3.5 transition-colors hover:bg-gray-200"
        }
      >
        <MessageCircle size={16} />
        Ask {sellerName}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6"
          onClick={close}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ask-seller-title"
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 id="ask-seller-title" className="text-lg font-bold">Ask {sellerName}</h2>
                {productName && <p className="text-sm text-gray-500 mt-0.5">About: {productName}</p>}
              </div>
              <button type="button" onClick={close} aria-label="Close" className="p-1 text-gray-400 hover:text-[#0e1a18]">
                <X size={18} />
              </button>
            </div>

            {sent ? (
              <div className="flex flex-col items-start gap-3 py-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#5fa8a0" }}>
                  <Check size={18} className="text-white" />
                </div>
                <p className="text-sm text-gray-600">
                  Sent. {sellerName} will contact you on {form.phone}, usually by WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="text-sm font-semibold rounded-full px-5 py-2 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input value={form.name} onChange={update("name")} placeholder="Your name" aria-label="Your name" required className={INPUT_CLASS} />
                <input
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="Phone or WhatsApp, e.g. 0977123456"
                  aria-label="Phone number"
                  inputMode="tel"
                  required
                  className={INPUT_CLASS}
                />
                <input value={form.email} onChange={update("email")} type="email" placeholder="Email (optional)" aria-label="Email" className={INPUT_CLASS} />
                <textarea
                  value={form.message}
                  onChange={update("message")}
                  placeholder="Ask about sizing, fabric, custom orders, or delivery"
                  aria-label="Your question"
                  rows={4}
                  required
                  className={`${INPUT_CLASS} resize-none`}
                />
                <input
                  value={form.website}
                  onChange={update("website")}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={isPending}
                  className="text-white text-sm font-bold rounded-full px-6 py-3 transition-colors hover:bg-[#4f958d] disabled:opacity-60"
                  style={{ backgroundColor: "#5fa8a0" }}
                >
                  {isPending ? "Sending..." : "Send question"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
