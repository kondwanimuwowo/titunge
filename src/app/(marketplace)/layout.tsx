import type { Metadata } from "next";
import { MarketplaceNav } from "@/components/marketplace/MarketplaceNav";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";
import { CartProvider } from "@/components/marketplace/CartProvider";

export const metadata: Metadata = {
  title: "Titunge marketplace",
  description: "Fabric, garments, and custom pieces from independent makers across Zambia.",
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-white">
        <MarketplaceNav />
        <main className="flex-1">{children}</main>
        <MarketplaceFooter />
      </div>
    </CartProvider>
  );
}
