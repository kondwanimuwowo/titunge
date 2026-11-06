"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getMarketplaceProductById } from "@/lib/marketplace-db";

export interface MarketplaceInquiryInput {
  /** Exactly one of productId or sellerSlug identifies who is being asked. */
  productId?: string;
  sellerSlug?: string;
  name: string;
  phone: string;
  email?: string;
  size?: string;
  message: string;
  /** Honeypot: real visitors never see or fill this field. */
  website?: string;
}

/** Public "Ask [business]" form on marketplace product and shop pages. Uses
 *  the service-role client because the visitor is anonymous; the target
 *  business is resolved server-side from an active listing, never taken
 *  from the client. */
export async function createMarketplaceInquiryAction(
  input: MarketplaceInquiryInput
): Promise<{ success: boolean; message?: string }> {
  if (input.website) return { success: true };

  const name = input.name.trim().slice(0, 120);
  const phone = input.phone.trim().slice(0, 30);
  const email = input.email?.trim().slice(0, 200) || null;
  const message = input.message.trim().slice(0, 2000);
  const size = input.size?.trim().slice(0, 40) || null;

  if (!name || phone.replace(/[^\d]/g, "").length < 9 || !message) {
    return { success: false, message: "Please add your name, a phone number, and your question." };
  }

  const admin = createAdminClient();
  let businessId: string | null = null;
  let productId: string | null = null;

  if (input.productId) {
    const product = await getMarketplaceProductById(input.productId);
    if (product) {
      businessId = product.businessId;
      productId = product.id;
    }
  } else if (input.sellerSlug) {
    const { data: business } = await (admin.from("businesses") as any)
      .select("id")
      .eq("slug", input.sellerSlug)
      .eq("status", "active")
      .maybeSingle();
    businessId = business?.id ?? null;
  }

  if (!businessId) {
    return { success: false, message: "This shop isn't accepting questions right now." };
  }

  const { error } = await (admin.from("customer_inquiries") as any).insert({
    business_id: businessId,
    product_id: productId,
    customer_name: name,
    customer_phone: phone,
    customer_email: email,
    preferred_size: size,
    special_requests: message,
    contact_method: "whatsapp",
    status: "new",
  });

  if (error) {
    console.error("Create marketplace inquiry error:", error);
    return { success: false, message: "Something went wrong sending your question. Please try again." };
  }

  await (admin.from("notifications") as any).insert({
    business_id: businessId,
    type: "order_update",
    title: `New question from ${name}`,
    message: message.length > 140 ? `${message.slice(0, 137)}...` : message,
    link: "/inquiries",
    read: false,
  });

  return { success: true };
}
