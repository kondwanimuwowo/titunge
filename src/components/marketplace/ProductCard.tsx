"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ImagePlaceholder } from "./ImagePlaceholder";
import type { MarketplaceProduct } from "@/data/marketplace-products";
import { formatZmw } from "@/lib/marketplace-currency";

export function ProductCard({ product }: { product: MarketplaceProduct }) {
  const [saved, setSaved] = useState(false);

  return (
    <Link
      href={`/product/${product.id}`}
      className="block bg-white rounded-xl shadow-[0_2px_12px_rgba(14,26,24,0.10)] overflow-hidden text-[#0e1a18]"
    >
      <div className="relative aspect-square">
        <ImagePlaceholder shape="rect" className="absolute inset-0 rounded-none" src={product.image} alt={product.name} />
        <button
          type="button"
          aria-label={saved ? "Remove from saved" : "Save"}
          onClick={(e) => {
            e.preventDefault();
            setSaved((v) => !v);
          }}
          className="absolute top-3 right-3 p-1"
        >
          <Heart
            size={22}
            fill={saved ? "#5fa8a0" : "#ffffff"}
            stroke={saved ? "#5fa8a0" : "#0e1a18"}
            strokeWidth={1.5}
          />
        </button>
      </div>
      <div className="p-4">
        <div className="text-[15px] font-bold leading-tight">{product.name}</div>
        <div className="text-[13px] text-gray-500 mt-1">{product.seller}</div>
        <div className="text-base font-extrabold mt-2">{formatZmw(product.priceZmw)}</div>
      </div>
    </Link>
  );
}
