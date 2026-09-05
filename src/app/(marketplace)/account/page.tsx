import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWishlistedProductIds } from "@/app/actions/marketplace-wishlist";
import { getMarketplaceProductById } from "@/lib/marketplace-db";
import { formatZmw } from "@/lib/marketplace-currency";
import { ImagePlaceholder } from "@/components/marketplace/ImagePlaceholder";
import { StatusBadge } from "@/components/marketplace/StatusBadge";
import { WishlistToggleButton } from "@/components/marketplace/WishlistToggleButton";
import BuyerSignOutButton from "@/components/marketplace/BuyerSignOutButton";
import Link from "next/link";
import type { MarketplaceOrderStatus } from "@/data/marketplace-orders";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/account/login");

  const [{ data: profile }, { data: orders }, wishlistProductIds] = await Promise.all([
    supabase.from("user_profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    supabase
      .from("marketplace_orders")
      .select("id, order_number, status, total, created_at")
      .eq("buyer_user_id", user.id)
      .order("created_at", { ascending: false }),
    getWishlistedProductIds(),
  ]);

  const wishlistProducts = (
    await Promise.all(wishlistProductIds.map((id) => getMarketplaceProductById(id)))
  ).filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {profile?.full_name || "Your account"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{profile?.email || user.email}</p>
        </div>
        <BuyerSignOutButton />
      </div>

      <section>
        <h2 className="text-lg font-bold mb-4">Your orders</h2>
        {!orders || orders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/my-orders/${order.order_number}`}
                className="flex items-center justify-between bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
              >
                <div>
                  <span className="text-sm font-bold">{order.order_number}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(order.created_at ?? "").toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">{formatZmw(Number(order.total))}</span>
                  <StatusBadge status={order.status as MarketplaceOrderStatus} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">Saved items</h2>
        {wishlistProducts.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nothing saved yet — tap the heart icon on any product to save it here.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {wishlistProducts.map((product) => (
              <div key={product.id} className="flex flex-col gap-2">
                <div className="relative">
                  <Link href={`/product/${product.id}`}>
                    <ImagePlaceholder shape="rect" className="w-full aspect-square" src={product.image} alt={product.name} />
                  </Link>
                  <div className="absolute top-2 right-2">
                    <WishlistToggleButton productId={product.id} initialWishlisted />
                  </div>
                </div>
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-sm text-gray-500">{formatZmw(product.priceZmw)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
