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
 * Reconciles every ready-made product an order holds against what it should
 * hold, in one pass. Replaces the old single-product ±1 logic now that an
 * order can carry several different products (and quantities > 1) at once —
 * there's no single "the" product to swap in and out any more, so this
 * diffs the ledger against order_items instead.
 *
 * `shouldHoldStock` is the caller's one judgment call (is this order, right
 * now, a live confirmed sale?); everything else — which products, how many
 * of each, what's already held — is read off order_items and the
 * inventory_transactions ledger, so create, edit, status change, cancel,
 * delete and restore all funnel through the same reconciliation instead of
 * each re-deriving it.
 */
export async function reconcileOrderProductStock(
  supabase: ServerClient,
  businessId: string,
  orderId: string,
  orderLabel: string,
  shouldHoldStock: boolean,
  /** orders.product_id, for orders from before multi-item orders (or edited
   *  through the single-item fallback path) that never got an order_items
   *  row — read as "1 unit of this product" only when order_items is empty,
   *  so a real itemized order with zero ready-made items isn't misread as
   *  holding its legacy product. */
  legacyProductId?: string | null
): Promise<{ warning?: string; moved: boolean }> {
  const [itemsResult, ledgerResult] = await Promise.all([
    (supabase.from("order_items") as any)
      .select("product_id, quantity")
      .eq("order_id", orderId)
      .not("product_id", "is", null),
    (supabase.from("inventory_transactions") as any)
      .select("product_id, quantity_change")
      .eq("order_id", orderId)
      .eq("business_id", businessId)
      .not("product_id", "is", null),
  ]);

  // An unreadable ledger means we cannot tell what this order holds, so skip
  // rather than guess — moving stock on a guess is the damaging direction.
  if (itemsResult.error || ledgerResult.error) {
    console.error(
      "Could not reconcile product stock:",
      itemsResult.error?.message || ledgerResult.error?.message
    );
    return { warning: "Stock could not be reconciled for this order.", moved: false };
  }

  const desired = new Map<string, number>();
  if ((itemsResult.data ?? []).length === 0 && legacyProductId) {
    desired.set(legacyProductId, 1);
  } else {
    for (const item of itemsResult.data ?? []) {
      if (!item.product_id) continue;
      desired.set(item.product_id, (desired.get(item.product_id) ?? 0) + (item.quantity ?? 1));
    }
  }

  const held = new Map<string, number>();
  for (const row of ledgerResult.data ?? []) {
    held.set(row.product_id, (held.get(row.product_id) ?? 0) - Number(row.quantity_change ?? 0));
  }

  const allProductIds = new Set([...desired.keys(), ...held.keys()]);
  let warning: string | undefined;
  let moved = false;

  for (const productId of allProductIds) {
    const desiredQty = shouldHoldStock ? desired.get(productId) ?? 0 : 0;
    const currentlyHeld = held.get(productId) ?? 0;
    const quantityChange = currentlyHeld - desiredQty;
    if (quantityChange === 0) continue;

    const result = await applyProductStock(
      supabase,
      businessId,
      productId,
      orderId,
      quantityChange,
      quantityChange < 0 ? "order_deduction" : "order_reservation_released",
      quantityChange < 0 ? `Deducted for ${orderLabel}` : `Released from ${orderLabel}`
    );

    if (!result.success) {
      warning = warning
        ? `${warning} Stock was also not fully updated for another item.`
        : `Stock was not fully updated. ${result.message}`;
    } else if (result.applied) {
      moved = true;
    }
  }

  return { warning, moved };
}
