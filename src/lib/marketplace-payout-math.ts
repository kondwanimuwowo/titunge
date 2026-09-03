/** Pure fee math, split out so it's testable without a database. */
export function computePayoutAmount(subtotal: number, commissionRate: number) {
  const platformFee = Math.floor(subtotal * commissionRate);
  const amount = subtotal - platformFee;
  return { platformFee, amount };
}

export function computeSeatBillingAmount(activeSeatCount: number, seatPriceKwacha: number) {
  const billableSeats = Math.max(activeSeatCount - 1, 0); // first seat is always free
  const amount = billableSeats * seatPriceKwacha;
  return { billableSeats, amount };
}
