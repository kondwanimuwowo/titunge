import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export interface ProductStockResult {
  success: boolean;
  applied: boolean;
  message?: string;
}

/**
 * Statuses at which a product order counts as a committed sale and so holds a
 * unit of stock. An order sitting at enquiry, contacted, measurements or
 * pending is not yet a sale — holding stock for it would quietly empty the
 * shelf for browsers who never come back.
 */
export const CONFIRMED_ORDER_STATUSES = [
  "in_progress",
  "production",
  "ready",
  "fitting",
  "completed",
  "delivered",
] as const;

export function isConfirmedOrderStatus(status: string | null | undefined): boolean {
  return (CONFIRMED_ORDER_STATUSES as readonly string[]).includes(status ?? "");
}

/**
 * Moves finished-goods stock for a product order and logs the movement.
 *
 * `applied` is false when there was nothing to move — no product on the order,
 * or a custom design, which is made to order. Insufficient stock comes back as
 * a failure so the caller can refuse the sale instead of going negative.
 *
 * The business id is passed through to the function, which re-checks the
 * caller's membership and that both order and product belong to that business:
 * the function is SECURITY DEFINER, so RLS is not doing that for us here.
 *
 * Kept out of the action modules on purpose: anything exported from a
 * "use server" file becomes a callable endpoint, and stock movement should
 * only ever be reachable through an order operation.
 */
export async function applyProductStock(
  supabase: ServerClient,
  businessId: string,
  productId: string | null | undefined,
  orderId: string,
  quantityChange: number,
  operationType: string,
  notes: string
): Promise<ProductStockResult> {
  if (!productId) return { success: true, applied: false };

  const { data, error } = await (supabase as any).rpc("apply_product_order_stock", {
    p_product_id: productId,
    p_order_id: orderId,
    p_business_id: businessId,
    p_quantity_change: quantityChange,
    p_operation_type: operationType,
    p_notes: notes,
  });

  if (error) {
    console.error("apply_product_order_stock failed:", error.message);
    return {
      success: false,
      applied: false,
      message: /insufficient stock/i.test(error.message)
        ? "This product is out of stock. Restock it before confirming the order."
        : `Could not update product stock: ${error.message}`,
    };
  }

  // Null means the product isn't stock-tracked, so nothing moved.
  return { success: true, applied: data !== null };
}

/**
 * Net product units currently held by an order, read from the movement ledger.
 * -1 means a unit is held; 0 means none is. Reading the ledger rather than the
 * order's status keeps every path idempotent — cancelling an order that was
 * already cancelled, or deleting one that was, moves nothing.
 *
 * Returns null when the balance could not be read. Callers must treat that as
 * "unknown" and move no stock: a failed read that fell back to 0 would read as
 * "holds nothing" and deduct a second unit, which is the damaging direction.
 */
export async function getProductReservationBalance(
  supabase: ServerClient,
  businessId: string,
  orderId: string
): Promise<number | null> {
  const { data, error } = await (supabase.from("inventory_transactions") as any)
    .select("quantity_change")
    .eq("order_id", orderId)
    .eq("business_id", businessId)
    .not("product_id", "is", null);

  if (error) {
    console.error("Could not read product reservation balance:", error.message);
    return null;
  }

  return (data || []).reduce(
    (sum: number, t: any) => sum + parseFloat(String(t.quantity_change || 0)),
    0
  );
}
