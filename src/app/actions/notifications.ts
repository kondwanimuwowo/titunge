"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireBusinessContext } from "@/lib/business-context";

type NotificationType = "low_stock" | "order_update" | "production_complete" | "system";

export async function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  userId?: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  try {
    const { error } = await (supabase.from("notifications") as any).insert([
      {
        user_id: userId || null,
        type,
        title,
        message,
        link: link || null,
        read: false,
        business_id: businessId,
      },
    ]);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/notifications");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to create notification" };
  }
}

export async function markAsRead(
  notificationId: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  try {
    const { error } = await (supabase.from("notifications") as any)
      .update({ read: true })
      .eq("id", notificationId)
      .eq("business_id", businessId);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/notifications");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to mark notification as read" };
  }
}

export async function markAllAsRead(): Promise<{ success: boolean; message?: string }> {
  const { businessId, userId } = await requireBusinessContext();
  const supabase = await createClient();

  try {
    const { error } = await (supabase.from("notifications") as any)
      .update({ read: true })
      .eq("user_id", userId)
      .eq("business_id", businessId)
      .eq("read", false);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/notifications");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to mark all as read" };
  }
}

export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; message?: string }> {
  const { businessId } = await requireBusinessContext();
  const supabase = await createClient();

  try {
    const { error } = await (supabase.from("notifications") as any)
      .delete()
      .eq("id", notificationId)
      .eq("business_id", businessId);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/notifications");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to delete notification" };
  }
}

// Helper: Notify low stock
export async function notifyLowStock(
  materialName: string,
  currentStock: number,
  minStock: number
) {
  return createNotification(
    "low_stock",
    "Low Stock Alert",
    `${materialName} is running low (${currentStock} ${currentStock === 1 ? "unit" : "units"} remaining, minimum: ${minStock})`,
    "/inventory"
  );
}

// Helper: Notify order update
export async function notifyOrderUpdate(
  orderNumber: string,
  status: "completed" | "delivered" | "cancelled",
  customerId?: string
) {
  const statusMessages: Record<string, string> = {
    completed: "Order completed and ready for delivery",
    delivered: "Order has been delivered to customer",
    cancelled: "Order has been cancelled",
  };

  const message = statusMessages[status] || `Order status updated to ${status}`;

  return createNotification(
    "order_update",
    `Order ${orderNumber}`,
    message,
    "/orders",
    customerId
  );
}

// Helper: Notify production complete
export async function notifyProductionComplete(
  batchNumber: string,
  productName: string,
  quantity: number
) {
  return createNotification(
    "production_complete",
    "Production Batch Complete",
    `Batch ${batchNumber} (${productName}) - ${quantity} pieces completed and added to inventory`,
    "/production"
  );
}
