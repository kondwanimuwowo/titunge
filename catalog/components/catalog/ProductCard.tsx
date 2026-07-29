"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface ProductCardProps {
  product: any;
  isFinishedGood?: boolean;
  index?: number;
  className?: string;
}

export function ProductCard({ product, isFinishedGood = false, index = 0, className = "" }: ProductCardProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const displayProduct = product;
  const imageUrl = displayProduct.image_url || "/images/products/placeholder.jpeg";
  const price = product.base_price;

  const formattedPrice = new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
  }).format(price || 0);

  const productUrl = `/product/${isFinishedGood ? `rtw-${product.id}` : product.id}`;

  const getStockBadge = () => {
    if (!isFinishedGood) return null;
    if (product.stock_quantity <= 0) return <Badge variant="destructive" className="absolute top-4 right-4 z-10 rounded-full">Sold Out</Badge>;
    if (product.stock_quantity < 5) return <Badge variant="secondary" className="absolute top-4 right-4 z-10 rounded-full bg-amber-50 text-amber-800 border-amber-200">Low Stock</Badge>;
    return null;
  };

  return (
    <div className={`group flex flex-col ${className}`}>
      <Link
        href={productUrl}
        onClick={() => setIsNavigating(true)}
        className="relative aspect-[3/4] overflow-hidden bg-secondary mb-5 rounded-3xl shadow-sm group-hover:shadow-xl transition-shadow duration-500"
      >
        {getStockBadge()}
        {isFinishedGood && (
          <Badge variant="outline" className="absolute bottom-4 left-4 z-10 rounded-full text-[9px] bg-background/90 backdrop-blur-sm">
            Ready to Wear
          </Badge>
        )}
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          priority={index !== undefined && index <= 3}
          className={`object-cover transition-all duration-1000 ease-out group-hover:scale-110 group-hover:opacity-80 ${isNavigating ? 'scale-110 brightness-50' : ''}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className={`absolute inset-0 transition-all duration-500 ${isNavigating ? 'bg-black/40' : 'bg-black/0 group-hover:bg-black/20'}`} />

        {/* Loading indicator */}
        {isNavigating && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}

        {/* Hover reveal */}
        {!isNavigating && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground bg-background/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
              Quick View
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {product.category}
        </p>
        <Link href={productUrl} onClick={() => setIsNavigating(true)}>
          <h3 className="font-serif text-xl font-medium leading-tight tracking-tight group-hover:text-primary transition-colors duration-300">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm font-light text-foreground/80">{formattedPrice}</p>
      </div>
    </div>
  );
}
