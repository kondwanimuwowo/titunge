import Link from "next/link";
import { Check } from "lucide-react";
import { FadeIn } from "@/components/marketing/FadeIn";

const PLANS = [
  {
    name: "Basic",
    price: "K1,500",
    period: "/month",
    description: "For the solo tailor or small workshop getting their operation off paper. Capture every order, track your clients, and keep your books in one place.",
    features: [
      "Up to 3 staff accounts",
      "Up to 20 active clients",
      "Orders and measurements management",
      "Inventory tracking",
      "Basic finance recording",
      "Customer inquiry management",
      "30-day free trial, no card required",
    ],
    cta: "Start 30-day trial",
    href: "/onboarding",
    featured: false,
  },
  {
    name: "Pro",
    price: "K3,000",
    period: "/month",
    description: "For a growing fashion house that needs the full picture — production schedules, team roles, and the numbers to make better decisions.",
    features: [
      "Up to 10 staff accounts",
      "Up to 50 active clients",
      "Everything in Basic",
      "Production tracking and scheduling",
      "Advanced analytics and reports",
      "Role-based access control",
      "Public product catalog app",
      "Priority support",
    ],
    cta: "Start 30-day trial",
    href: "/onboarding",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "K8,000",
    period: "/month",
    description: "For manufacturers and exporters running at scale. Unlimited everything, custom branding, and a dedicated support line so nothing slows you down.",
    features: [
      "Unlimited staff accounts",
      "Unlimited clients",
      "Everything in Pro",
      "Custom logo and brand colours",
      "Custom subdomain (yourshop.titunge.com)",
      "Multiple business locations",
      "Dedicated account support",
    ],
    cta: "Contact us",
    href: "/contact",
    featured: false,
  },
];

const FAQ = [
  {
    q: "Is there a free trial?",
    a: "Every plan starts with a 30-day trial, no credit card required. You get full access to all features on your chosen plan for the entire trial period.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades apply at the end of your billing period.",
  },
  {
    q: "Are prices in Zambian Kwacha?",
    a: "Yes. All plan prices are billed in ZMW. Your subscription renews monthly on the same date you signed up.",
  },
  {
    q: "What happens when I hit my client or staff limit?",
    a: "You can continue using the system for existing records but will be prompted to upgrade before adding new staff or client profiles. Nothing gets locked or deleted.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Each business's data is fully isolated using row-level security. No other tenant can access your records, and you can export everything at any time.",
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
              Every plan includes a 30-day free trial. No card required to start.
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
