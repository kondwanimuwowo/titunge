import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getWishlistedProductIds } from "@/app/actions/marketplace-wishlist";
import { getMarketplaceProductById } from "@/lib/marketplace-db";
import { AccountTabs } from "@/components/marketplace/AccountTabs";
import BuyerSignOutButton from "@/components/marketplace/BuyerSignOutButton";
import type { AccountOrder } from "@/components/marketplace/AccountOrderCard";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/account/login");

  const [{ data: profile }, { data: orderRows }, wishlistProductIds] = await Promise.all([
    supabase.from("user_profiles").select("full_name, email, created_at").eq("id", user.id).maybeSingle(),
    supabase
      .from("marketplace_orders")
      .select("id, order_number, status, total, created_at")
      .eq("buyer_user_id", user.id)
      .order("created_at", { ascending: false }),
    getWishlistedProductIds(),
  ]);

  // marketplace_order_items has its own tenant_isolation policy scoped to
  // seller businesses, not buyers, so a buyer's own client can't read it
  // directly. The order list above already proved ownership (RLS-filtered
  // by buyer_user_id), so it's safe to fetch the matching items here.
  const orderIds = (orderRows ?? []).map((o) => o.id);
  const admin = createAdminClient();
  const { data: itemRows } = orderIds.length
    ? await admin.from("marketplace_order_items").select("order_id, product_name, seller_name, image_url").in("order_id", orderIds)
    : { data: [] };

  const orders: AccountOrder[] = (orderRows ?? []).map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    total: Number(order.total),
    createdAt: order.created_at ?? new Date().toISOString(),
    items: (itemRows ?? [])
      .filter((item) => item.order_id === order.id)
      .map((item) => ({ productName: item.product_name, sellerName: item.seller_name, imageUrl: item.image_url })),
  }));

  const wishlistProducts = (
    await Promise.all(wishlistProductIds.map((id) => getMarketplaceProductById(id)))
  ).filter((p): p is NonNullable<typeof p> => p !== null);

  const displayName = profile?.full_name || "Your account";
  const initial = (profile?.full_name || user.email || "?").trim().charAt(0).toUpperCase();
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
            style={{ backgroundColor: "#5fa8a0" }}
          >
            {initial}
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{displayName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {profile?.email || user.email}
              {memberSince ? ` · Member since ${memberSince}` : ""}
            </p>
          </div>
        </div>
        <BuyerSignOutButton />
      </div>

      <AccountTabs orders={orders} wishlistProducts={wishlistProducts} />
    </div>
  );
}
