import Link from "next/link";
import { Check } from "lucide-react";
import { FadeIn } from "@/components/marketing/FadeIn";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: null,
    description: "Enough to replace your spreadsheets and get every order recorded.",
    features: [
      "Up to 50 orders per month",
      "1 user account",
      "Orders and customer management",
      "Inventory tracking",
      "Basic finance recording",
      "Email support",
    ],
    cta: "Get started free",
    featured: false,
  },
  {
    name: "Growth",
    price: "$29",
    period: "/month",
    description: "For workshops processing steady order volume with a team of tailors.",
    features: [
      "Unlimited orders",
      "Up to 5 user accounts",
      "All modules: orders, inventory, customers, production, finance, analytics",
      "Public product catalog app",
      "Customer inquiry management",
      "Priority email support",
    ],
    cta: "Start 14-day trial",
    featured: true,
  },
  {
    name: "Scale",
    price: "$79",
    period: "/month",
    description: "For larger operations or workshops managing multiple locations.",
    features: [
      "Unlimited orders and users",
      "Multiple business locations",
      "Custom subdomain (yourshop.titunge.com)",
      "Logo and brand color customization",
      "Advanced analytics",
      "Dedicated support",
    ],
    cta: "Get started",
    featured: false,
  },
];

const FAQ = [
  {
    q: "Is there a free trial?",
    a: "The Growth plan includes a 14-day trial with no credit card required. After the trial, you can stay on Starter or upgrade to keep full access.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades apply at the end of your billing period.",
  },
  {
    q: "What counts as an order?",
    a: "Any order record you create in the system, regardless of its status. Cancelled orders still count toward your monthly limit on the Starter plan.",
  },
  {
    q: "Do you support currencies other than USD?",
    a: "Yes. Each business can set its own local currency. Pricing for the software is billed in USD.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Each business's data is isolated using row-level security. No tenant can access another's records.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16" style={{ backgroundColor: "#f5f1ee" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <h1
              className="text-4xl lg:text-6xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Simple pricing
            </h1>
            <p className="mt-4 text-lg text-gray-500 max-w-lg">
              Start free. Pay only when your business is ready to grow.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
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
                    href="/onboarding"
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
