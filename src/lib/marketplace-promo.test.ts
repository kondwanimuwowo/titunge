import { describe, it, expect } from "vitest";
import { computeDiscount, isPromoCodeValid } from "./marketplace-promo";

describe("computeDiscount", () => {
  it("computes a percent discount and rounds down", () => {
    expect(computeDiscount(999, { discount_type: "percent", discount_value: 10 })).toBe(99);
  });

  it("caps a fixed discount at the subtotal, never going negative", () => {
    expect(computeDiscount(50, { discount_type: "fixed", discount_value: 200 })).toBe(50);
  });

  it("applies a fixed discount normally when it's smaller than the subtotal", () => {
    expect(computeDiscount(500, { discount_type: "fixed", discount_value: 100 })).toBe(100);
  });
});

describe("isPromoCodeValid", () => {
  const base = { discount_type: "percent" as const, discount_value: 10, max_uses: null, use_count: 0, expires_at: null, active: true };

  it("accepts an active code with no limits", () => {
    expect(isPromoCodeValid(base)).toBe(true);
  });

  it("rejects an inactive code", () => {
    expect(isPromoCodeValid({ ...base, active: false })).toBe(false);
  });

  it("rejects an expired code", () => {
    expect(isPromoCodeValid({ ...base, expires_at: "2020-01-01T00:00:00Z" })).toBe(false);
  });

  it("accepts a code that has not expired yet", () => {
    expect(isPromoCodeValid({ ...base, expires_at: "2999-01-01T00:00:00Z" })).toBe(true);
  });

  it("rejects a code that has hit its use limit", () => {
    expect(isPromoCodeValid({ ...base, max_uses: 5, use_count: 5 })).toBe(false);
  });

  it("accepts a code under its use limit", () => {
    expect(isPromoCodeValid({ ...base, max_uses: 5, use_count: 4 })).toBe(true);
  });
});
