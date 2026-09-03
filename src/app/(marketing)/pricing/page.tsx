import Link from "next/link";
import { Check } from "lucide-react";
import { FadeIn } from "@/components/marketing/FadeIn";

const PLANS = [
  {
    name: "Free",
    price: "K0",
    period: "/month",
    description: "For individual tailors, designers, and small fashion businesses. Run your whole workshop online, from day one, at no cost.",
    features: [
      "1 user",
      "Business dashboard, orders, and production management",
      "Customer management and measurements",
      "Inventory, finance, and analytics",
      "Business profile and Titunge marketplace listing",
      "Your own online storefront — receive orders online",
      "No monthly subscription",
    ],
    cta: "Start free",
    href: "/onboarding",
    featured: false,
  },
  {
    name: "Team",
    price: "K250",
    period: "/additional user/month",
    description: "For growing businesses with employees and teams. Your first user is always free — pay only as you add staff.",
    features: [
      "Everything in Free",
      "Additional staff accounts with role-based permissions",
      "Team management, multiple staff working simultaneously",
      "Advanced analytics and finance",
      "Full inventory and production management",
      "Sales, order, and business performance reporting",
    ],
    cta: "Upgrade anytime in Settings",
    href: "/onboarding",
    featured: true,
  },
];

const FAQ = [
  {
    q: "Is the Free plan really free?",
    a: "Yes — no monthly subscription, no trial period, no card required. It's the full ERP for a single user, indefinitely. You only pay once you add a second user, or when you sell through the marketplace.",
  },
  {
    q: "How does Team-plan billing work?",
    a: "Your first user always stays free. Each additional staff account is K250/month, billed monthly based on how many active users your business has that month.",
  },
  {
    q: "Can I upgrade or add staff later?",
    a: "Yes — upgrade to Team anytime from Settings > Billing. There's no downgrade path needed since Free never expires; you simply add users as you grow.",
  },
  {
    q: "What's the marketplace transaction fee?",
    a: "Titunge takes a 10% fee on sales made through the marketplace, on both Free and Team plans. There are no separate listing fees — you only pay when an item actually sells.",
  },
  {
    q: "Are prices in Zambian Kwacha?",
    a: "Yes. All plan and marketplace prices are in ZMW.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Each business's data is fully isolated using row-level security. No other tenant can access your records.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-36 pb-16" style={{ backgroundColor: "#f5f1ee" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <h1
              className="text-4xl lg:text-6xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Simple pricing
            </h1>
            <p className="mt-4 text-lg text-gray-500 max-w-lg">
              Start free. Add your team as you grow, and only pay a transaction fee when you sell through the marketplace.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-2xl mx-auto">
            {PLANS.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.08}>
                <div
                  className="rounded-xl p-8"
                  style={{
                    backgroundColor: plan.featured ? "#0e1a18" : "white",
                    boxShadow: plan.featured
                      ? "0 12px 40px rgba(14,26,24,0.18)"
                      : "0 2px 16px rgba(0,0,0,0.06)",
                  }}
                >
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-4 ${plan.featured ? "text-[#5fa8a0]" : "text-gray-400"}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span
                      className={`text-5xl font-bold tracking-tight ${plan.featured ? "text-white" : "text-gray-900"}`}
                      style={{ fontFamily: "var(--font-canter)" }}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-gray-400 ml-0.5">{plan.period}</span>
                    )}
                  </div>
                  <p className={`text-sm leading-relaxed mb-8 ${plan.featured ? "text-gray-400" : "text-gray-500"}`}>
                    {plan.description}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check
                          size={15}
                          className="shrink-0 mt-0.5"
                          style={{ color: "#5fa8a0" }}
                          strokeWidth={2.5}
                        />
                        <span className={`text-sm ${plan.featured ? "text-gray-300" : "text-gray-600"}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className="block w-full text-center text-sm font-semibold rounded-full px-6 py-3 transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: plan.featured ? "#5fa8a0" : "#f5f1ee",
                      color: plan.featured ? "white" : "#0e1a18",
                    }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28" style={{ backgroundColor: "#f5f1ee" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <h2
              className="text-3xl font-bold text-gray-900 mb-12"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Common questions
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 max-w-3xl">
            {FAQ.map((item, i) => (
              <FadeIn key={item.q} delay={i * 0.06}>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{item.q}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
