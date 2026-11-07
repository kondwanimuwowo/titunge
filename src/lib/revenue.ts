/** Revenue is earned when an order is completed or delivered. Finance, the
 *  dashboard, analytics and the orders page all use this one rule. */
export const EARNED_STATUSES = ["completed", "delivered"] as const;

export function isEarnedStatus(status: string | null | undefined): boolean {
  return (EARNED_STATUSES as readonly string[]).includes((status ?? "").toLowerCase());
}
