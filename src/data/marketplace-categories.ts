import {
  Baby, BadgeCheck, Briefcase, Crown, Drum, Flower2, Footprints, Gem, Layers, Scissors, Shirt, Sparkles, type LucideIcon,
} from "lucide-react";

export interface MarketplaceCategory {
  slug: string;
  name: string;
  icon: LucideIcon;
  href: string;
  /** Other words buyers use for this category; search matches them too. */
  keywords?: string[];
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  { slug: "chitenge", name: "Chitenge", icon: Sparkles, href: "/browse?category=chitenge", keywords: ["ankara", "kitenge", "wax print"] },
  { slug: "womens-wear", name: "Women's wear", icon: Flower2, href: "/browse?category=womens-wear", keywords: ["women", "ladies", "dress"] },
  { slug: "mens-wear", name: "Men's wear", icon: Shirt, href: "/browse?category=mens-wear", keywords: ["men", "gents", "shirt"] },
  { slug: "suits", name: "Suits", icon: Briefcase, href: "/browse?category=suits", keywords: ["suit", "blazer", "tuxedo"] },
  { slug: "childrens-wear", name: "Children's wear", icon: Baby, href: "/browse?category=childrens-wear", keywords: ["kids", "children", "baby"] },
  { slug: "traditional-wear", name: "Traditional wear", icon: Drum, href: "/browse?category=traditional-wear", keywords: ["traditional", "cultural"] },
  { slug: "bridal", name: "Bridal and occasion", icon: Crown, href: "/browse?category=bridal", keywords: ["wedding", "bride", "occasion"] },
  { slug: "uniforms", name: "Uniforms", icon: BadgeCheck, href: "/browse?category=uniforms", keywords: ["uniform", "school", "nurse", "scrubs", "workwear"] },
  { slug: "bespoke-tailoring", name: "Bespoke tailoring", icon: Scissors, href: "/browse?category=bespoke-tailoring", keywords: ["custom", "made to measure", "tailor"] },
  { slug: "fabric", name: "Fabric", icon: Layers, href: "/browse?category=fabric", keywords: ["material", "cloth"] },
  { slug: "shoes", name: "Shoes", icon: Footprints, href: "/browse?category=shoes", keywords: ["shoe", "footwear"] },
  { slug: "accessories", name: "Accessories", icon: Gem, href: "/browse?category=accessories", keywords: ["tie", "bag", "jewellery"] },
];

/** Category slugs whose name or keywords contain the search text. */
export function categorySlugsMatching(query: string): string[] {
  const normalise = (s: string) => s.toLowerCase().replace(/'/g, "");
  const q = normalise(query.trim());
  if (q.length < 3) return [];
  // Whole-word matching, so "women" doesn't match the "men" keyword.
  const words = q.split(/[^a-z]+/).filter((w) => w.length >= 3);
  const matches = (term: string) =>
    term.includes(" ")
      ? q.includes(term)
      : words.some((w) => w === term || w.startsWith(term) || term.startsWith(w));
  return MARKETPLACE_CATEGORIES.filter((c) => {
    const nameWords = normalise(c.name).split(/[^a-z]+/).filter((w) => w.length >= 3 && w !== "and");
    return nameWords.some(matches) || (c.keywords ?? []).map(normalise).some(matches);
  }).map((c) => c.slug);
}
