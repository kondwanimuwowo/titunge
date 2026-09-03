import { describe, it, expect } from "vitest";
import { computePayoutAmount, computeSeatBillingAmount } from "./marketplace-payout-math";

describe("computePayoutAmount", () => {
  it("takes the platform's commission and leaves the rest for the seller", () => {
    const { platformFee, amount } = computePayoutAmount(1000, 0.1);
    expect(platformFee).toBe(100);
    expect(amount).toBe(900);
  });

  it("rounds the platform fee down, never up, so the seller is never shorted by rounding", () => {
    const { platformFee, amount } = computePayoutAmount(99, 0.1); // 9.9 -> floor 9
    expect(platformFee).toBe(9);
    expect(amount).toBe(90);
  });

  it("handles a zero commission rate", () => {
    const { platformFee, amount } = computePayoutAmount(500, 0);
    expect(platformFee).toBe(0);
    expect(amount).toBe(500);
  });
});

describe("computeSeatBillingAmount", () => {
  it("bills nothing for a single-seat business — the first seat is always free", () => {
    const { billableSeats, amount } = computeSeatBillingAmount(1, 250);
    expect(billableSeats).toBe(0);
    expect(amount).toBe(0);
  });

  it("only charges for seats beyond the first", () => {
    const { billableSeats, amount } = computeSeatBillingAmount(4, 250);
    expect(billableSeats).toBe(3);
    expect(amount).toBe(750);
  });

  it("never bills a negative seat count even if active count is somehow 0", () => {
    const { billableSeats, amount } = computeSeatBillingAmount(0, 250);
    expect(billableSeats).toBe(0);
    expect(amount).toBe(0);
  });
});
