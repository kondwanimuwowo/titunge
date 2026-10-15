"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/marketplace/CartProvider";
import { CheckoutSteps } from "@/components/marketplace/CheckoutSteps";
import { OrderSummaryPanel, type OrderSummaryItem } from "@/components/marketplace/OrderSummaryPanel";

const COUNTRIES = ["Zambia", "Ghana", "Nigeria", "Kenya", "Senegal", "South Africa"];

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
    fulfillmentMethod,
    setFulfillmentMethod,
    canPickup,
    products,
  } = useCart();

  const [fullName, setFullName] = useState(shippingDetails?.fullName ?? "");
  const [email, setEmail] = useState(shippingDetails?.email ?? "");
  const [phone, setPhone] = useState(shippingDetails?.phone ?? "");
  const [country, setCountry] = useState(shippingDetails?.country ?? COUNTRIES[0]);
  const [city, setCity] = useState(shippingDetails?.city ?? "");
  const [street, setStreet] = useState(shippingDetails?.street ?? "");
  const [notes, setNotes] = useState(shippingDetails?.notes ?? "");

  useEffect(() => {
    if (hydrated && items.length === 0) router.replace("/cart");
  }, [hydrated, items.length, router]);

  useEffect(() => {
    if (hydrated && !canPickup && fulfillmentMethod === "pickup") setFulfillmentMethod("delivery");
  }, [hydrated, canPickup, fulfillmentMethod, setFulfillmentMethod]);

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
    setShippingDetails({ fullName, email, phone, country, city, street, notes });
    router.push("/checkout/payment");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Checkout</h1>
      <CheckoutSteps active={1} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <h2 className="text-lg font-bold">Delivery details</h2>

          {canPickup && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentMethod("delivery")}
                className="text-sm font-semibold rounded-full px-6 py-2.5"
                style={{
                  backgroundColor: fulfillmentMethod === "delivery" ? "#0e1a18" : "#f5f5f5",
                  color: fulfillmentMethod === "delivery" ? "#fff" : "#0e1a18",
                }}
              >
                Delivery
              </button>
              <button
                type="button"
                onClick={() => setFulfillmentMethod("pickup")}
                className="text-sm font-semibold rounded-full px-6 py-2.5"
                style={{
                  backgroundColor: fulfillmentMethod === "pickup" ? "#0e1a18" : "#f5f5f5",
                  color: fulfillmentMethod === "pickup" ? "#fff" : "#0e1a18",
                }}
              >
                Pick up from store
              </button>
            </div>
          )}

          {fulfillmentMethod === "pickup" && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-4">
              No delivery fee. The seller will contact you to arrange pickup once your order is confirmed.
            </p>
          )}

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
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5"
            />
          </div>

          {fulfillmentMethod === "delivery" && (
            <>
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
            </>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="notes">
              {fulfillmentMethod === "pickup" ? "Notes (optional)" : "Delivery notes (optional)"}
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
          deliveryLabel={fulfillmentMethod === "pickup" ? "Pickup" : "Delivery"}
        />
      </div>
    </div>
  );
}
