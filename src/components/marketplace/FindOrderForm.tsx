"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { findMarketplaceOrderAction } from "@/app/actions/marketplace-checkout";
import { rememberOrder } from "@/lib/marketplace-orders";

export function FindOrderForm() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await findMarketplaceOrderAction(orderNumber, phone);
      if (!result.success || !result.orderNumber) {
        setError(result.message ?? "We couldn't find that order.");
        return;
      }
      rememberOrder(result.orderNumber);
      router.push(`/my-orders/${encodeURIComponent(result.orderNumber)}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 rounded-xl px-5 py-4 flex flex-col gap-3">
      <p className="text-sm font-semibold">Find an order</p>
      <p className="text-xs text-gray-500">Placed an order on another device? Enter the order number from your confirmation and the phone number you paid with.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order number, e.g. TG-12345"
          aria-label="Order number"
          required
          className="flex-1 text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone, e.g. 0977123456"
          aria-label="Phone number"
          inputMode="tel"
          required
          className="flex-1 text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
        />
        <button
          type="submit"
          disabled={isPending}
          className="text-sm font-semibold text-white rounded-full px-5 py-2 whitespace-nowrap transition-colors hover:bg-[#4f958d] disabled:opacity-60"
          style={{ backgroundColor: "#5fa8a0" }}
        >
          {isPending ? "Searching..." : "Find order"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
