import type { PublicPricing } from "@/lib/marketplace-db";

export interface PlanCard {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
}

export interface PricingFaq {
  q: string;
  a: string;
}

// The plan only limits seats. Every module is available on Free, so Team lists
// only what extra seats unlock.
export function getPlans({ seatPriceKwacha }: PublicPricing): PlanCard[] {
  return [
    {
      name: "Free",
      price: "K0",
      period: "/month",
      description:
        "For individual tailors, designers, and small fashion businesses. The full workshop system for one user, free for as long as you use it.",
      features: [
        "1 user",
        "Orders, production, and customer measurements",
        "Inventory, finance, and analytics",
        "Quotes and invoices emailed to customers",
        "Your own shop on the Titunge marketplace",
        "No monthly subscription",
      ],
      cta: "Start free",
      href: "/onboarding",
      featured: false,
    },
    {
      name: "Team",
      price: `K${seatPriceKwacha.toLocaleString()}`,
      period: "/additional user/month",
      description:
        "For growing businesses with staff. Your first user is always free. You only pay for each extra person you add.",
      features: [
        "Everything in Free",
        "Additional staff accounts",
        "Admin, manager, and employee roles",
        "Multiple staff working at the same time",
        "Billed monthly by mobile money",
      ],
      cta: "Start free, add staff later",
      href: "/onboarding",
      featured: true,
    },
  ];
}

export function getPricingFaq({ commissionPercent, seatPriceKwacha, payoutReleaseHours }: PublicPricing): PricingFaq[] {
  return [
    {
      q: "Is the Free plan really free?",
      a: "Yes. There's no subscription, no trial period, and no card required. It's the full system for a single user, for as long as you use it. You only pay when you add a second user, or when you sell through the marketplace.",
    },
    {
      q: "How does Team billing work?",
      a: `Your first user always stays free. Each additional active staff account is K${seatPriceKwacha.toLocaleString()}/month, charged monthly to your mobile money number.`,
    },
    {
      q: "Can I add staff later?",
      a: "Yes. Switch to Team from Settings > Billing whenever you're ready. Free never expires, so there's nothing to downgrade from.",
    },
    {
      q: "What's the marketplace fee?",
      a: `Titunge takes a ${commissionPercent}% fee on marketplace sales, on both plans. There are no listing fees. You can absorb the fee or pass it on to the buyer, and you're paid ${payoutReleaseHours} hours after each order is delivered.`,
    },
    {
      q: "Are prices in Zambian Kwacha?",
      a: "Yes. All plan and marketplace prices are in ZMW, and payments run on Airtel Money, MTN MoMo, and Zamtel Kwacha.",
    },
    {
      q: "Is my data secure?",
      a: "Yes. Each business's data is isolated at the database level. No other business can access your records.",
    },
  ];
}
