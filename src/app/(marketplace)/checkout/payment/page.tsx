"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/marketplace/CartProvider";
import { CheckoutSteps } from "@/components/marketplace/CheckoutSteps";
import { OrderSummaryPanel, type OrderSummaryItem } from "@/components/marketplace/OrderSummaryPanel";
import { MARKETPLACE_PRODUCTS } from "@/data/marketplace-products";
import { formatZmw } from "@/lib/marketplace-currency";
import { placeOrder } from "@/lib/marketplace-orders";

const MOMO_PROVIDERS = ["MTN Mobile Money", "Airtel Money", "M-Pesa", "Zamtel Kwacha"];

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { items, subtotal, delivery, total, hydrated, shippingDetails, clearCart } = useCart();
  const [method, setMethod] = useState<"momo" | "card">("momo");
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    if (!hydrated || orderPlaced) return;
    if (items.length === 0) router.replace("/cart");
    else if (!shippingDetails) router.replace("/checkout");
  }, [hydrated, items.length, shippingDetails, orderPlaced, router]);

  if (!hydrated || (!orderPlaced && (items.length === 0 || !shippingDetails))) return null;

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

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const order = placeOrder(items);
    setOrderPlaced(true);
    clearCart();
    router.push(`/order-confirmation?order=${order.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Checkout</h1>
      <CheckoutSteps active={2} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        <form onSubmit={handlePlaceOrder} className="flex flex-col gap-5">
          <h2 className="text-lg font-bold">How would you like to pay?</h2>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMethod("momo")}
              className="text-sm font-semibold rounded-full px-6 py-2.5"
              style={{ backgroundColor: method === "momo" ? "#0e1a18" : "#f5f5f5", color: method === "momo" ? "#fff" : "#0e1a18" }}
            >
              Mobile money
            </button>
            <button
              type="button"
              onClick={() => setMethod("card")}
              className="text-sm font-semibold rounded-full px-6 py-2.5"
              style={{ backgroundColor: method === "card" ? "#0e1a18" : "#f5f5f5", color: method === "card" ? "#fff" : "#0e1a18" }}
            >
              Card
            </button>
          </div>

          {method === "momo" ? (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="provider">Provider</label>
                <select id="provider" required className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5">
                  {MOMO_PROVIDERS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="momoNumber">Mobile money number</label>
                <input id="momoNumber" required className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5" />
              </div>
              <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-600">
                You will get a prompt on your phone to approve the payment of {formatZmw(total)}.
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="cardNumber">Card number</label>
                <input id="cardNumber" required className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" htmlFor="expiry">Expiry (MM/YY)</label>
                  <input id="expiry" required className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" htmlFor="cvc">Security code</label>
                  <input id="cvc" required className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="cardName">Name on card</label>
                <input id="cardName" required className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5" />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-fit text-white text-sm font-bold rounded-full px-8 py-3.5 transition-colors hover:bg-[#4f958d]"
            style={{ backgroundColor: "#5fa8a0" }}
          >
            Review and place order
          </button>

          <p className="text-xs text-gray-500">
            This is a demo checkout — no real payment is processed. Payments would normally be held by Titunge and released to the seller when your order ships.
          </p>
        </form>

        <OrderSummaryPanel items={summaryItems} subtotal={subtotal} delivery={delivery} total={total} />
      </div>
    </div>
  );
}
