import { MarketplaceNav } from "@/components/marketplace/MarketplaceNav";
import { MarketplaceFooter } from "@/components/marketplace/MarketplaceFooter";
import { CartProvider } from "@/components/marketplace/CartProvider";

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
