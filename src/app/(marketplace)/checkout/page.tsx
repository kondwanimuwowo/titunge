"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/marketplace/CartProvider";
import { CheckoutSteps } from "@/components/marketplace/CheckoutSteps";
import { OrderSummaryPanel, type OrderSummaryItem } from "@/components/marketplace/OrderSummaryPanel";
import { MARKETPLACE_PRODUCTS } from "@/data/marketplace-products";

const COUNTRIES = ["Zambia", "Ghana", "Nigeria", "Kenya", "Senegal", "South Africa"];

export default function CheckoutShippingPage() {
  const router = useRouter();
  const { items, subtotal, delivery, total, hydrated, shippingDetails, setShippingDetails } = useCart();

  const [fullName, setFullName] = useState(shippingDetails?.fullName ?? "");
  const [phone, setPhone] = useState(shippingDetails?.phone ?? "");
  const [country, setCountry] = useState(shippingDetails?.country ?? COUNTRIES[0]);
  const [city, setCity] = useState(shippingDetails?.city ?? "");
  const [street, setStreet] = useState(shippingDetails?.street ?? "");
  const [notes, setNotes] = useState(shippingDetails?.notes ?? "");

  useEffect(() => {
    if (hydrated && items.length === 0) router.replace("/cart");
  }, [hydrated, items.length, router]);

  if (!hydrated || items.length === 0) return null;

  const summaryItems: OrderSummaryItem[] = items.map((line) => {
    const product = MARKETPLACE_PRODUCTS.find((p) => p.id === line.productId);
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
    setShippingDetails({ fullName, phone, country, city, street, notes });
    router.push("/checkout/payment");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Checkout</h1>
      <CheckoutSteps active={1} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <h2 className="text-lg font-bold">Delivery details</h2>

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
            <label className="block text-sm font-semibold mb-1.5" htmlFor="phone">Phone number</label>
            <input
              id="phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" htmlFor="country">Country</label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" htmlFor="city">City</label>
              <input
                id="city"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="street">Street address</label>
            <input
              id="street"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="notes">Delivery notes (optional)</label>
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

        <OrderSummaryPanel items={summaryItems} subtotal={subtotal} delivery={delivery} total={total} />
      </div>
    </div>
  );
}
