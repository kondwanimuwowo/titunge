"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { InquiryForm } from "@/components/inquiry/InquiryForm";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Ruler, Info, Clock, CreditCard, Sparkles } from "lucide-react";

interface ProductDetailClientProps {
  product: any;
  isFinishedGood: boolean;
}

export function ProductDetailClient({ product, isFinishedGood }: ProductDetailClientProps) {
  const displayProduct = product;

  const [activeImage, setActiveImage] = useState(displayProduct.image_url || "/images/products/placeholder.jpeg");
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const galleryImages = [
    displayProduct.image_url,
    ...(displayProduct.gallery_images || [])
  ].filter(Boolean);

  const price = product.base_price;
  const formattedPrice = new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
  }).format(price || 0);

  const lencoPublicKey = process.env.NEXT_PUBLIC_LENCO_PUBLIC_KEY;

  const handlePaymentSuccess = (reference: string) => {
    setIsCheckoutModalOpen(false);
    // Could show a success page or redirect
  };

  return (
    <>
      {/* Load Lenco payment script */}
      {isFinishedGood && lencoPublicKey && (
        <Script
          src="https://pay.lenco.co/js/v1/inline.js"
          strategy="lazyOnload"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-20 pb-32 md:pb-0">
        {/* Image Gallery */}
        <div className="space-y-3 md:space-y-4 md:sticky md:top-32 h-fit">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary rounded-3xl shadow-lg">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          {galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden bg-secondary rounded-xl snap-start transition-all duration-300 ${
                    activeImage === img ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col pt-4 md:pt-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
              {product.category}
            </span>
            {isFinishedGood && <Badge variant="outline" className="rounded-full">Ready to Wear</Badge>}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light tracking-tight">{product.name}</h1>
            <div className="w-12 h-px bg-primary" />
          </div>

          <p className="text-lg md:text-xl font-light text-foreground">{formattedPrice}</p>

          <div className="text-sm md:text-base text-muted-foreground font-light leading-relaxed">
            <p>{product.description || displayProduct.description || "No description available."}</p>
          </div>

          <div className="space-y-6 mb-10 hidden md:block">
            {isFinishedGood ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-[0.15em]">Availability</span>
                  {product.stock_quantity > 0 ? (
                    <Badge variant="outline" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200">In Stock ({product.stock_quantity})</Badge>
                  ) : (
                    <Badge variant="destructive" className="rounded-full">Sold Out</Badge>
                  )}
                </div>
                {lencoPublicKey && (
                  <button
                    onClick={() => setIsCheckoutModalOpen(true)}
                    disabled={product.stock_quantity <= 0}
                    className="pill-btn justify-center bg-foreground text-background text-sm font-medium uppercase tracking-[0.15em] hover:bg-foreground/85 active:bg-foreground/75 disabled:opacity-40 disabled:pointer-events-none w-full sm:w-auto min-h-[44px]"
                  >
                    <CreditCard className="h-4 w-4" />
                    Buy Now
                    <span className="pill-btn-icon bg-background/15" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {displayProduct.estimated_days && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-light">Estimated production: <strong className="font-medium text-foreground">{displayProduct.estimated_days} days</strong></span>
                  </div>
                )}
                <button
                  onClick={() => setIsInquiryModalOpen(true)}
                  className="pill-btn justify-center bg-foreground text-background text-sm font-medium uppercase tracking-[0.15em] hover:bg-foreground/85 active:bg-foreground/75 w-full sm:w-auto min-h-[44px]"
                >
                  Enquire About This Design
                  <span className="pill-btn-icon bg-background/15" />
                </button>
              </div>
            )}
          </div>

          {/* Details Accordion */}
          <div className="glass-card rounded-[24px] px-6 py-2 space-y-2">
            {displayProduct.fabric_details && (
              <details className="group border-b border-border/10 last:border-b-0 py-4">
                <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.2em] text-foreground outline-none">
                  <span className="flex items-center gap-3"><Info className="h-4 w-4 text-primary" /> Fabric & Details</span>
                  <span className="transition-transform group-open:rotate-180">↓</span>
                </summary>
                <p className="text-sm text-muted-foreground font-light leading-relaxed pl-7 pt-4">
                  {displayProduct.fabric_details}
                </p>
              </details>
            )}

            {displayProduct.size_guide && (
              <details className="group border-b border-border/10 last:border-b-0 py-4">
                <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.2em] text-foreground outline-none">
                  <span className="flex items-center gap-3"><Ruler className="h-4 w-4 text-primary" /> Size Guide</span>
                  <span className="transition-transform group-open:rotate-180">↓</span>
                </summary>
                <p className="text-sm text-muted-foreground font-light leading-relaxed pl-7 pt-4">
                  {displayProduct.size_guide}
                </p>
              </details>
            )}

            {displayProduct.care_instructions && (
              <details className="group border-b border-border/10 last:border-b-0 py-4">
                <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.2em] text-foreground outline-none">
                  <span className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-primary" /> Care Instructions</span>
                  <span className="transition-transform group-open:rotate-180">↓</span>
                </summary>
                <p className="text-sm text-muted-foreground font-light leading-relaxed pl-7 pt-4">
                  {displayProduct.care_instructions}
                </p>
              </details>
            )}
          </div>
        </div>

        {/* Mobile Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-gradient-to-t from-black/95 to-black/80 z-40 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] border-t border-white/10">
          <div className="container mx-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {isFinishedGood ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-light text-white/80">Price</span>
                  <span className="text-lg font-semibold text-white">{formattedPrice}</span>
                </div>
                {lencoPublicKey && (
                  <button
                    onClick={() => setIsCheckoutModalOpen(true)}
                    disabled={product.stock_quantity <= 0}
                    className="w-full sm:flex-1 pill-btn justify-center text-xs font-bold uppercase tracking-[0.15em] bg-white text-black hover:bg-white/90 active:bg-white/80 disabled:opacity-40 disabled:pointer-events-none touch-highlight min-h-[44px]"
                  >
                    <CreditCard className="h-4 w-4" />
                    Buy Now
                    <span className="pill-btn-icon bg-black/10" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsInquiryModalOpen(true)}
                className="w-full pill-btn justify-center text-xs font-bold uppercase tracking-[0.15em] bg-white text-black hover:bg-white/90 active:bg-white/80 touch-highlight min-h-[44px]"
              >
                Enquire About This Design
                <span className="pill-btn-icon bg-black/10" />
              </button>
            )}
          </div>
        </div>

        {/* Inquiry Modal (custom designs) */}
        <Modal
          isOpen={isInquiryModalOpen}
          onClose={() => setIsInquiryModalOpen(false)}
          title={`Enquire: ${product.name}`}
        >
          <InquiryForm
            productId={product.id}
            productName={product.name}
            onSuccess={() => {}}
          />
        </Modal>

        {/* Checkout Modal (finished goods) */}
        <Modal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          title="Checkout"
        >
          <CheckoutForm
            productId={product.id}
            productName={product.name}
            price={price}
            onSuccess={handlePaymentSuccess}
            onClose={() => setIsCheckoutModalOpen(false)}
          />
        </Modal>
      </div>
    </>
  );
}
