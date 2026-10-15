import { redirect } from "next/navigation";

// Marketplace Orders merged into the Orders page as a tab (see /orders) —
// kept as a redirect so old links/bookmarks still land somewhere useful.
export default function MarketplaceOrdersRedirect() {
  redirect("/orders?tab=marketplace");
}
