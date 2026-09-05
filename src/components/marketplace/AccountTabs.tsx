"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Heart, Compass } from "lucide-react";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { WishlistToggleButton } from "./WishlistToggleButton";
import { AccountOrderCard, type AccountOrder } from "./AccountOrderCard";
import { formatZmw } from "@/lib/marketplace-currency";
import type { MarketplaceProduct } from "@/lib/marketplace-db";

type Tab = "orders" | "saved";

export function AccountTabs({
  orders,
  wishlistProducts,
}: {
  orders: AccountOrder[];
  wishlistProducts: MarketplaceProduct[];
}) {
  const [tab, setTab] = useState<Tab>("orders");

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setTab("orders")}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-3 border-b-2 transition-colors ${
            tab === "orders" ? "border-[#5fa8a0] text-[#0e1a18]" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <Package size={15} />
          Orders
          {orders.length > 0 && <span className="text-xs text-gray-400">{orders.length}</span>}
        </button>
        <button
          type="button"
          onClick={() => setTab("saved")}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-3 border-b-2 transition-colors ${
            tab === "saved" ? "border-[#5fa8a0] text-[#0e1a18]" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <Heart size={15} />
          Saved items
          {wishlistProducts.length > 0 && <span className="text-xs text-gray-400">{wishlistProducts.length}</span>}
        </button>
      </div>

      {tab === "orders" &&
        (orders.length === 0 ? (
          <EmptyState
            icon={<Compass size={22} className="text-gray-300" />}
            title="No orders yet"
            body="Once you buy something on Titunge, it will show up here."
            ctaLabel="Browse the marketplace"
            ctaHref="/browse"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <AccountOrderCard key={order.id} order={order} />
            ))}
          </div>
        ))}

      {tab === "saved" &&
        (wishlistProducts.length === 0 ? (
          <EmptyState
            icon={<Heart size={22} className="text-gray-300" />}
            title="Nothing saved yet"
            body="Tap the heart on any product to keep it here for later."
            ctaLabel="Browse the marketplace"
            ctaHref="/browse"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {wishlistProducts.map((product) => (
              <div key={product.id} className="flex flex-col gap-2">
                <div className="relative">
                  <Link href={`/product/${product.id}`}>
                    <ImagePlaceholder shape="rect" className="w-full aspect-square" src={product.image} alt={product.name} />
                  </Link>
                  <div className="absolute top-2 right-2">
                    <WishlistToggleButton productId={product.id} initialWishlisted />
                  </div>
                </div>
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-sm text-gray-500">{formatZmw(product.priceZmw)}</p>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6 bg-gray-50 rounded-xl">
      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">{icon}</div>
      <p className="text-sm font-semibold text-[#0e1a18]">{title}</p>
      <p className="text-sm text-gray-500 mt-1 max-w-xs">{body}</p>
      <Link
        href={ctaHref}
        className="mt-5 text-sm font-semibold text-white rounded-full px-6 py-2.5 transition-colors hover:bg-[#4f958d]"
        style={{ backgroundColor: "#5fa8a0" }}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
