import { Shirt, Grid2x2, Sparkles, Scissors, Gem, Crown, type LucideIcon } from "lucide-react";

export interface MarketplaceCategory {
  slug: string;
  name: string;
  icon: LucideIcon;
  href: string;
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  { slug: "ankara-fabric", name: "Ankara fabric", icon: Grid2x2, href: "/browse?category=ankara-fabric" },
  { slug: "kente", name: "Kente", icon: Sparkles, href: "/browse?category=kente" },
  { slug: "ready-to-wear", name: "Ready-to-wear", icon: Shirt, href: "/browse?category=ready-to-wear" },
  { slug: "bespoke-tailoring", name: "Bespoke tailoring", icon: Scissors, href: "/browse?category=bespoke-tailoring" },
  { slug: "accessories", name: "Accessories", icon: Gem, href: "/browse?category=accessories" },
  { slug: "bridal", name: "Bridal", icon: Crown, href: "/browse?category=bridal" },
];
