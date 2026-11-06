"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/marketplace/CartProvider";
import { CheckoutSteps } from "@/components/marketplace/CheckoutSteps";
import { OrderSummaryPanel, type OrderSummaryItem } from "@/components/marketplace/OrderSummaryPanel";

export default function CheckoutShippingPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    delivery,
    platformFee,
    total,
    hydrated,
    shippingDetails,
    setShippingDetails,
    products,
  } = useCart();

  const [fullName, setFullName] = useState(shippingDetails?.fullName ?? "");
  const [email, setEmail] = useState(shippingDetails?.email ?? "");
  const [phone, setPhone] = useState(shippingDetails?.phone ?? "");
  const [notes, setNotes] = useState(shippingDetails?.notes ?? "");

  useEffect(() => {
    if (hydrated && items.length === 0) router.replace("/cart");
  }, [hydrated, items.length, router]);

  if (!hydrated || items.length === 0) return null;

  const summaryItems: OrderSummaryItem[] = items.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    return {
      key: `${line.productId}::${line.size}`,
      name: product?.name ?? "Item",
      meta: `Qty ${line.qty}`,
      qty: line.qty,
      priceZmw: product?.priceZmw ?? 0,
      image: product?.image,
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShippingDetails({ fullName, email, phone, notes });
    router.push("/checkout/payment");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Checkout</h1>
      <CheckoutSteps active={1} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <h2 className="text-lg font-bold">Your details</h2>

          <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-4">
            Delivery isn&apos;t included in the price. Once you&apos;ve paid, the seller will contact you on the phone
            number below to arrange delivery or collection.
          </p>

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="phone">Phone number</label>
            <input
              id="phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="0977123456"
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="notes">
              Message for the seller (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5"
            />
          </div>

          <button
            type="submit"
            className="w-fit text-white text-sm font-bold rounded-full px-8 py-3.5 transition-colors hover:bg-[#4f958d]"
            style={{ backgroundColor: "#5fa8a0" }}
          >
            Continue to payment
          </button>
        </form>

        <OrderSummaryPanel
          items={summaryItems}
          subtotal={subtotal}
          delivery={delivery}
          platformFee={platformFee}
          total={total}
        />
      </div>
    </div>
  );
}
