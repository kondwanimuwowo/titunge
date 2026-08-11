"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/components/marketplace/CartProvider";
import { ImagePlaceholder } from "@/components/marketplace/ImagePlaceholder";
import { OrderSummaryPanel } from "@/components/marketplace/OrderSummaryPanel";
import { MARKETPLACE_PRODUCTS } from "@/data/marketplace-products";
import { formatZmw } from "@/lib/marketplace-currency";

export default function CartPage() {
  const { items, incQty, decQty, removeItem, subtotal, delivery, total } = useCart();

  const lines = items
    .map((line) => {
      const product = MARKETPLACE_PRODUCTS.find((p) => p.id === line.productId);
      if (!product) return null;
      return { ...line, product };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">Your basket</h1>

      {lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24">
          <p className="text-gray-500 mb-6">Your basket is empty.</p>
          <Link
            href="/browse"
            className="text-white text-sm font-semibold rounded-full px-7 py-3 transition-colors hover:bg-[#4f958d]"
            style={{ backgroundColor: "#5fa8a0" }}
          >
            Browse items
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          <div className="flex flex-col gap-4">
            {lines.map((line) => (
              <div key={`${line.productId}::${line.size}`} className="flex items-center gap-4 bg-white rounded-xl shadow-[0_2px_12px_rgba(14,26,24,0.10)] p-4">
                <ImagePlaceholder shape="rect" className="w-20 h-20 shrink-0" src={line.product.image} alt={line.product.name} />
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${line.productId}`} className="text-sm font-bold hover:text-[#5fa8a0] transition-colors">
                    {line.product.name}
                  </Link>
                  <div className="text-xs text-gray-500 mt-1">{line.product.seller}</div>
                  <div className="text-xs text-gray-500">Size: {line.size}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => decQty(line.productId, line.size)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="text-sm w-5 text-center">{line.qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => incQty(line.productId, line.size)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => removeItem(line.productId, line.size)}
                  className="text-gray-400 hover:text-gray-700 shrink-0"
                >
                  <X size={16} />
                </button>
                <div className="text-sm font-bold shrink-0 w-20 text-right">{formatZmw(line.product.priceZmw * line.qty)}</div>
              </div>
            ))}
          </div>

          <OrderSummaryPanel
            subtotal={subtotal}
            delivery={delivery}
            total={total}
            footnote="Tracked delivery within Africa, 5 to 9 days."
            cta={
              <Link
                href="/checkout"
                className="block text-center text-white text-sm font-bold rounded-full px-6 py-3.5 transition-colors hover:bg-[#4f958d]"
                style={{ backgroundColor: "#5fa8a0" }}
              >
                Proceed to checkout
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
