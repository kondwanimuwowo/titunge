export const PAYMENT_METHODS = ["Cash", "Mobile Money", "Bank Transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
