"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { MarketplaceProduct } from "@/lib/marketplace-db";
import { DELIVERY_FEE_ZMW } from "@/data/marketplace-orders";
import { computePayoutAmount } from "@/lib/marketplace-payout-math";

// Mirrors platform_settings.commission_rate's default. Used only for the
// pre-payment preview shown here — the authoritative figure is always
// recomputed server-side from the live setting in createPendingOrderAction,
// so a stale value here can only make this preview momentarily off, never
// the actual amount charged.
const PREVIEW_COMMISSION_RATE = 0.1;

export interface CartLine {
  productId: string;
  size: string;
  qty: number;
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  notes: string;
}

export type FulfillmentMethod = "delivery" | "pickup";

interface CartState {
  items: CartLine[];
  shippingDetails: ShippingDetails | null;
  fulfillmentMethod: FulfillmentMethod;
}

const STORAGE_KEY = "titunge-cart";

function lineKey(productId: string, size: string) {
  return `${productId}::${size}`;
}

interface CartContextValue {
  items: CartLine[];
  shippingDetails: ShippingDetails | null;
  fulfillmentMethod: FulfillmentMethod;
  /** True only when every line in the cart is sold by the same seller —
   *  picking up a multi-seller order from "a store" isn't a coherent offer. */
  canPickup: boolean;
  addItem: (productId: string, size: string, qty?: number) => void;
  incQty: (productId: string, size: string) => void;
  decQty: (productId: string, size: string) => void;
  removeItem: (productId: string, size: string) => void;
  clearCart: () => void;
  setShippingDetails: (details: ShippingDetails) => void;
  setFulfillmentMethod: (method: FulfillmentMethod) => void;
  subtotal: number;
  delivery: number;
  /** Preview of the marketplace fee passed through to the buyer, for sellers
   *  with marketplace_fee_mode = 'pass_to_customer'. Server-recomputed and
   *  authoritative at order creation — see PREVIEW_COMMISSION_RATE above. */
  platformFee: number;
  total: number;
  hydrated: boolean;
  products: MarketplaceProduct[];
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({ items: [], shippingDetails: null, fulfillmentMethod: "delivery" });
  const [hydrated, setHydrated] = useState(false);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    fetch("/api/marketplace/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const addItem = (productId: string, size: string, qty = 1) => {
    setState((s) => {
      const key = lineKey(productId, size);
      const existing = s.items.find((i) => lineKey(i.productId, i.size) === key);
      if (existing) {
        return { ...s, items: s.items.map((i) => (lineKey(i.productId, i.size) === key ? { ...i, qty: i.qty + qty } : i)) };
      }
      return { ...s, items: [...s.items, { productId, size, qty }] };
    });
  };

  const incQty = (productId: string, size: string) => {
    setState((s) => ({
      ...s,
      items: s.items.map((i) => (i.productId === productId && i.size === size ? { ...i, qty: i.qty + 1 } : i)),
    }));
  };

  const decQty = (productId: string, size: string) => {
    setState((s) => ({
      ...s,
      items: s.items.map((i) => (i.productId === productId && i.size === size ? { ...i, qty: Math.max(1, i.qty - 1) } : i)),
    }));
  };

  const removeItem = (productId: string, size: string) => {
    setState((s) => ({ ...s, items: s.items.filter((i) => !(i.productId === productId && i.size === size)) }));
  };

  const clearCart = () => {
    setState((s) => ({ ...s, items: [] }));
  };

  const setShippingDetails = (details: ShippingDetails) => {
    setState((s) => ({ ...s, shippingDetails: details }));
  };

  const setFulfillmentMethod = (method: FulfillmentMethod) => {
    setState((s) => ({ ...s, fulfillmentMethod: method }));
  };

  const cartSellerSlugs = new Set(
    state.items
      .map((line) => products.find((p) => p.id === line.productId)?.sellerSlug)
      .filter((slug): slug is string => Boolean(slug))
  );
  const canPickup = cartSellerSlugs.size === 1;

  const subtotal = state.items.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.productId);
    return sum + (product ? product.priceZmw * line.qty : 0);
  }, 0);
  const delivery = state.items.length === 0 || (state.fulfillmentMethod === "pickup" && canPickup) ? 0 : DELIVERY_FEE_ZMW;

  const subtotalByBusiness = new Map<string, number>();
  for (const line of state.items) {
    const product = products.find((p) => p.id === line.productId);
    if (!product) continue;
    subtotalByBusiness.set(
      product.businessId,
      (subtotalByBusiness.get(product.businessId) || 0) + product.priceZmw * line.qty
    );
  }
  let platformFee = 0;
  for (const line of state.items) {
    const product = products.find((p) => p.id === line.productId);
    if (!product || product.marketplaceFeeMode !== "pass_to_customer") continue;
    // Each business's fee is computed once, on its own total subtotal, not
    // per line — delete after the first line so a second line from the same
    // seller doesn't recompute (and re-add) it.
    const businessSubtotal = subtotalByBusiness.get(product.businessId);
    if (businessSubtotal === undefined) continue;
    platformFee += computePayoutAmount(businessSubtotal, PREVIEW_COMMISSION_RATE).platformFee;
    subtotalByBusiness.delete(product.businessId);
  }

  const total = subtotal + delivery + platformFee;

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        shippingDetails: state.shippingDetails,
        fulfillmentMethod: state.fulfillmentMethod,
        canPickup,
        addItem,
        incQty,
        decQty,
        removeItem,
        clearCart,
        setShippingDetails,
        setFulfillmentMethod,
        subtotal,
        delivery,
        platformFee,
        total,
        hydrated,
        products,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
