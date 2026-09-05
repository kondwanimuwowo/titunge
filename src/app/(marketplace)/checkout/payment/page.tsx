"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/components/marketplace/CartProvider";
import { CheckoutSteps } from "@/components/marketplace/CheckoutSteps";
import { OrderSummaryPanel, type OrderSummaryItem } from "@/components/marketplace/OrderSummaryPanel";
import { formatZmw } from "@/lib/marketplace-currency";
import { rememberOrder } from "@/lib/marketplace-orders";
import {
  createPendingOrderAction,
  initiateMobileMoneyPaymentAction,
  checkOrderPaymentStatusAction,
} from "@/app/actions/marketplace-checkout";

const OPERATORS: { value: "airtel" | "mtn" | "zamtel"; label: string }[] = [
  { value: "airtel", label: "Airtel Money" },
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "zamtel", label: "Zamtel Kwacha" },
];

const LENCO_PUBLIC_KEY = process.env.NEXT_PUBLIC_LENCO_PUBLIC_KEY;
const LENCO_WIDGET_SRC =
  process.env.NEXT_PUBLIC_LENCO_SANDBOX === "true"
    ? "https://pay.sandbox.lenco.co/js/v1/inline.js"
    : "https://pay.lenco.co/js/v1/inline.js";

interface LencoPayOptions {
  key: string;
  reference: string;
  email: string;
  amount: number;
  currency: string;
  channels: string[];
  label?: string;
  customer?: { firstName?: string; lastName?: string; phone?: string };
  onSuccess?: (response: { reference: string }) => void;
  onClose?: () => void;
  onConfirmationPending?: () => void;
}

declare global {
  interface Window {
    LencoPay?: { getPaid: (options: LencoPayOptions) => void };
  }
}

type PaymentPhase = "idle" | "starting" | "awaiting-approval" | "polling" | "failed";

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { items, subtotal, delivery, total, hydrated, shippingDetails, clearCart, products } = useCart();
  const [method, setMethod] = useState<"momo" | "card">("momo");
  const [operator, setOperator] = useState<"airtel" | "mtn" | "zamtel">("airtel");
  const [momoPhone, setMomoPhone] = useState(shippingDetails?.phone ?? "");
  const [phase, setPhase] = useState<PaymentPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const orderRef = useRef<{ orderId: string; orderNumber: string; reference: string } | null>(null);
  const pollCancelled = useRef(false);

  useEffect(() => {
    if (!hydrated || orderPlaced) return;
    if (items.length === 0) router.replace("/cart");
    else if (!shippingDetails) router.replace("/checkout");
  }, [hydrated, items.length, shippingDetails, orderPlaced, router]);

  useEffect(() => {
    return () => {
      pollCancelled.current = true;
    };
  }, []);

  if (!hydrated || (!orderPlaced && (items.length === 0 || !shippingDetails))) return null;

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

  /** Creates the real pending order once, reusing it across retries/method switches. */
  const ensureOrder = async () => {
    if (orderRef.current) return orderRef.current;
    if (!shippingDetails) throw new Error("Missing shipping details.");

    const result = await createPendingOrderAction({
      items: items.map((i) => ({ productId: i.productId, size: i.size, qty: i.qty })),
      shippingDetails,
      buyerEmail: shippingDetails.email,
    });

    if (!result.success || !result.orderId || !result.orderNumber || !result.reference) {
      throw new Error(result.message || "Failed to create order.");
    }

    orderRef.current = { orderId: result.orderId, orderNumber: result.orderNumber, reference: result.reference };
    return orderRef.current;
  };

  const pollForSettlement = async (orderId: string, orderNumber: string) => {
    setPhase("polling");
    for (let attempt = 0; attempt < 20; attempt++) {
      if (pollCancelled.current) return;
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await checkOrderPaymentStatusAction(orderId);
      if (pollCancelled.current) return;

      if (!result.success) continue;

      if (result.paymentStatus === "successful") {
        setOrderPlaced(true);
        rememberOrder(orderNumber);
        clearCart();
        router.push(`/order-confirmation?order=${orderNumber}`);
        return;
      }
      if (result.paymentStatus === "failed") {
        setPhase("failed");
        setError("Payment was not successful. You can try again.");
        return;
      }
      // still pending, keep polling
    }
    setPhase("failed");
    setError(
      "We couldn't confirm the payment in time. If you approved it on your phone, your order is still recorded. Check My Orders shortly, or try again."
    );
  };

  const handleMobileMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPhase("starting");

    try {
      const order = await ensureOrder();
      const result = await initiateMobileMoneyPaymentAction({ orderId: order.orderId, phone: momoPhone, operator });
      if (!result.success) {
        setPhase("failed");
        setError(result.message || "Failed to start mobile money payment.");
        return;
      }
      setPhase("awaiting-approval");
      pollForSettlement(order.orderId, order.orderNumber);
    } catch (err: unknown) {
      setPhase("failed");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleCardPay = async () => {
    setError(null);
    setPhase("starting");

    if (!LENCO_PUBLIC_KEY) {
      setPhase("failed");
      setError("Card payment isn't configured yet. Use mobile money instead.");
      return;
    }
    if (!window.LencoPay) {
      setPhase("failed");
      setError("Payment widget is still loading. Try again in a moment.");
      return;
    }

    try {
      const order = await ensureOrder();
      const [firstName, ...rest] = (shippingDetails?.fullName ?? "").split(" ");

      window.LencoPay.getPaid({
        key: LENCO_PUBLIC_KEY,
        reference: order.reference,
        email: shippingDetails?.email ?? "",
        amount: total,
        currency: "ZMW",
        channels: ["card"],
        customer: { firstName, lastName: rest.join(" "), phone: shippingDetails?.phone },
        onSuccess: () => pollForSettlement(order.orderId, order.orderNumber),
        onConfirmationPending: () => pollForSettlement(order.orderId, order.orderNumber),
        onClose: () => setPhase("idle"),
      });
    } catch (err: unknown) {
      setPhase("failed");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const busy = phase === "starting" || phase === "awaiting-approval" || phase === "polling";

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
      {method === "card" && <Script src={LENCO_WIDGET_SRC} strategy="lazyOnload" />}

      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Checkout</h1>
      <CheckoutSteps active={2} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        <div className="flex flex-col gap-5">
          <h2 className="text-lg font-bold">How would you like to pay?</h2>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMethod("momo")}
              disabled={busy}
              className="text-sm font-semibold rounded-full px-6 py-2.5 disabled:opacity-50"
              style={{ backgroundColor: method === "momo" ? "#0e1a18" : "#f5f5f5", color: method === "momo" ? "#fff" : "#0e1a18" }}
            >
              Mobile money
            </button>
            <button
              type="button"
              onClick={() => setMethod("card")}
              disabled={busy}
              className="text-sm font-semibold rounded-full px-6 py-2.5 disabled:opacity-50"
              style={{ backgroundColor: method === "card" ? "#0e1a18" : "#f5f5f5", color: method === "card" ? "#fff" : "#0e1a18" }}
            >
              Card
            </button>
          </div>

          {method === "momo" ? (
            <form onSubmit={handleMobileMoneySubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="operator">Network</label>
                <select
                  id="operator"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as typeof operator)}
                  disabled={busy}
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5"
                >
                  {OPERATORS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="momoNumber">Mobile money number</label>
                <input
                  id="momoNumber"
                  required
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  disabled={busy}
                  className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5"
                />
              </div>

              {phase === "awaiting-approval" || phase === "polling" ? (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-4 text-sm text-gray-700 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                  Check your phone to approve the payment of {formatZmw(total)}...
                </div>
              ) : (
                <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-600">
                  You will get a prompt on your phone to approve the payment of {formatZmw(total)}.
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-fit text-white text-sm font-bold rounded-full px-8 py-3.5 transition-colors hover:bg-[#4f958d] disabled:opacity-60"
                style={{ backgroundColor: "#5fa8a0" }}
              >
                {busy ? "Waiting for approval..." : `Pay ${formatZmw(total)}`}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-gray-600">
                You&apos;ll be taken to a secure Lenco checkout to enter your card details.
              </p>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
              )}

              <button
                type="button"
                onClick={handleCardPay}
                disabled={busy}
                className="w-fit text-white text-sm font-bold rounded-full px-8 py-3.5 transition-colors hover:bg-[#4f958d] disabled:opacity-60"
                style={{ backgroundColor: "#5fa8a0" }}
              >
                {busy ? "Waiting for payment..." : `Pay ${formatZmw(total)} with card`}
              </button>
            </div>
          )}
        </div>

        <OrderSummaryPanel items={summaryItems} subtotal={subtotal} delivery={delivery} total={total} />
      </div>
    </div>
  );
}
