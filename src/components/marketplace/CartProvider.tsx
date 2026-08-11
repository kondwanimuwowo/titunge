"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MARKETPLACE_PRODUCTS } from "@/data/marketplace-products";
import { DELIVERY_FEE_ZMW } from "@/data/marketplace-orders";

export interface CartLine {
  productId: string;
  size: string;
  qty: number;
}

export interface ShippingDetails {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  notes: string;
}

interface CartState {
  items: CartLine[];
  shippingDetails: ShippingDetails | null;
}

const STORAGE_KEY = "titunge-cart";

function lineKey(productId: string, size: string) {
  return `${productId}::${size}`;
}

interface CartContextValue {
  items: CartLine[];
  shippingDetails: ShippingDetails | null;
  addItem: (productId: string, size: string, qty?: number) => void;
  incQty: (productId: string, size: string) => void;
  decQty: (productId: string, size: string) => void;
  removeItem: (productId: string, size: string) => void;
  clearCart: () => void;
  setShippingDetails: (details: ShippingDetails) => void;
  subtotal: number;
  delivery: number;
  total: number;
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({ items: [], shippingDetails: null });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
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

  const subtotal = state.items.reduce((sum, line) => {
    const product = MARKETPLACE_PRODUCTS.find((p) => p.id === line.productId);
    return sum + (product ? product.priceZmw * line.qty : 0);
  }, 0);
  const delivery = state.items.length > 0 ? DELIVERY_FEE_ZMW : 0;
  const total = subtotal + delivery;

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        shippingDetails: state.shippingDetails,
        addItem,
        incQty,
        decQty,
        removeItem,
        clearCart,
        setShippingDetails,
        subtotal,
        delivery,
        total,
        hydrated,
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
