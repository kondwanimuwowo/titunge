export interface PromoCodeRecord {
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses: number | null;
  use_count: number;
  expires_at: string | null;
  active: boolean;
}

/** Never discounts below zero, and rounds a percent discount down so the
 *  buyer is never charged less than the code actually grants. */
export function computeDiscount(subtotal: number, promo: Pick<PromoCodeRecord, "discount_type" | "discount_value">): number {
  if (promo.discount_type === "percent") {
    return Math.floor(subtotal * (promo.discount_value / 100));
  }
  return Math.min(promo.discount_value, subtotal);
}

export function isPromoCodeValid(promo: PromoCodeRecord, now = new Date()): boolean {
  if (!promo.active) return false;
  if (promo.expires_at && new Date(promo.expires_at) < now) return false;
  if (promo.max_uses != null && promo.use_count >= promo.max_uses) return false;
  return true;
}
