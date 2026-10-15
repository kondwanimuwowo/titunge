import { redirect } from "next/navigation";

// Marketplace Sales merged into the Analytics page as a tab (see
// /analytics) — kept as a redirect so old links/bookmarks still work.
export default function MarketplaceAnalyticsRedirect() {
  redirect("/analytics?tab=marketplace");
}
