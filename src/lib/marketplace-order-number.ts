/** Postgres unique_violation error code. */
export const UNIQUE_VIOLATION = "23505";

export function generateOrderNumber(): string {
  return `TG-${Math.floor(10000 + Math.random() * 90000)}`;
}

/** Retries an order insert on order_number collision (90,000 possibilities,
 *  a UNIQUE constraint, but no retry meant a collision used to surface a raw
 *  Postgres error straight to the buyer mid-checkout). `attemptInsert` is
 *  called with a fresh order number each try. */
export async function insertWithOrderNumberRetry<T>(
  attemptInsert: (orderNumber: string) => Promise<{ data: T | null; error: { code?: string; message: string } | null }>,
  maxAttempts = 5
): Promise<{ data: T | null; error: { code?: string; message: string } | null }> {
  let result: { data: T | null; error: { code?: string; message: string } | null } = {
    data: null,
    error: { message: "insertWithOrderNumberRetry: maxAttempts must be at least 1" },
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    result = await attemptInsert(generateOrderNumber());
    if (!result.error || result.error.code !== UNIQUE_VIOLATION) return result;
  }

  return result;
}
