import { Shirt, Grid2x2, Sparkles, Scissors, Gem, Crown, type LucideIcon } from "lucide-react";

export interface MarketplaceCategory {
  name: string;
  icon: LucideIcon;
  href: string;
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  { name: "Ankara fabric", icon: Grid2x2, href: "/browse?category=ankara-fabric" },
  { name: "Kente", icon: Sparkles, href: "/browse?category=kente" },
  { name: "Ready-to-wear", icon: Shirt, href: "/browse?category=ready-to-wear" },
  { name: "Bespoke tailoring", icon: Scissors, href: "/browse?category=bespoke-tailoring" },
  { name: "Accessories", icon: Gem, href: "/browse?category=accessories" },
  { name: "Bridal", icon: Crown, href: "/browse?category=bridal" },
];
