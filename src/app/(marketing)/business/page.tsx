import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BarChart3, Box, Users, Scissors, Wallet, ClipboardList, ArrowRight, Check } from "lucide-react";
import { FadeIn } from "@/components/marketing/FadeIn";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { getPublicPricing } from "@/lib/marketplace-db";
import { getPlans } from "@/data/plans";

// Plan and fee figures come live from platform_settings.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Titunge for Business | Software for tailoring workshops",
  description: "Orders, measurements, production, inventory, and payments for tailoring and garment businesses. Free for one user.",
};

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  image: string;
}

// Hidden until there's a real customer quote with permission to use it.
const TESTIMONIAL = null as Testimonial | null;

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Orders",
    description: "Create and track every order from first contact to final delivery. Status updates, due dates, and customer notes in one place.",
  },
  {
    icon: Box,
    title: "Inventory",
    description: "Track fabric, thread, and materials by quantity and unit cost. Know what you have before you promise a client.",
  },
  {
    icon: Users,
    title: "Customers",
    description: "Store measurement records, order history, and contact details for every client. No more searching through notebooks.",
  },
  {
    icon: Scissors,
    title: "Production",
    description: "Manage batch production runs, assign orders to tailors, and track material consumption per batch.",
  },
  {
    icon: Wallet,
    title: "Finance",
    description: "Record payments, log expenses, and see your revenue and outstanding balances at a glance.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Understand which products sell, which months are busy, and how your business is growing over time.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Set up your workshop",
    description: "Add your products, fabric types, and team members. Most workshops are up and running in under an hour.",
  },
  {
    number: "02",
    title: "Take and manage orders",
    description: "Create orders from walk-ins or inquiries. Track status as work moves through your production queue.",
  },
  {
    number: "03",
    title: "Track money in and out",
    description: "Record payments as they come in. Log material and overhead costs. See your margin at the end of each month.",
  },
];

export default async function BusinessPage() {
  const pricing = await getPublicPricing();
  const PLANS = getPlans(pricing);
  const HERO_FACTS = [
    { value: "K0", label: "for one user, with every module included" },
    { value: `K${pricing.seatPriceKwacha.toLocaleString()}`, label: "per extra staff member, per month" },
    { value: "Mobile money", label: "built in for marketplace payments and payouts" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative pt-36 pb-16 lg:pt-44 lg:pb-24" style={{ backgroundColor: "#0e1a18" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#5fa8a0]/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#7cc0b8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5fa8a0]" />
              For tailors, designers and garment makers
            </p>
          </FadeIn>
          <FadeIn className="max-w-3xl">
            <h1
              className="text-5xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Run your workshop,{" "}
              <span style={{ color: "#5fa8a0" }}>not your paperwork</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.1} className="mt-6 max-w-xl">
            <p className="text-lg text-gray-400 leading-relaxed">
              Titunge is ERP software built for tailoring and garment businesses. Manage orders, materials, customers, and payments from a single dashboard.
            </p>
          </FadeIn>
          <FadeIn delay={0.18} className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white rounded-full px-7 py-3.5 transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#5fa8a0" }}
            >
              Start free
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center text-sm font-medium text-gray-300 rounded-full px-7 py-3.5 border border-gray-700 hover:border-gray-500 transition-colors"
            >
              See all features
            </Link>
          </FadeIn>

          <FadeIn delay={0.26} className="mt-14 flex flex-wrap gap-x-10 gap-y-4">
            {HERO_FACTS.map((stat) => (
              <div key={stat.label}>
                <p
                  className="text-3xl font-bold leading-none"
                  style={{ color: "#5fa8a0", fontFamily: "var(--font-canter)" }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-gray-400 mt-1.5 max-w-[140px] leading-snug">{stat.label}</p>
              </div>
            ))}
          </FadeIn>

          <FadeIn delay={0.34} className="relative z-10 mt-16 lg:mt-20">
            <ProductPreview />
          </FadeIn>
        </div>

        {/* Subtle grid decoration */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 70% 40%, rgba(95,168,160,0.06) 0%, transparent 60%)",
          }}
        />
      </section>

      {/* Features */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <h2
              className="text-3xl lg:text-4xl font-bold text-gray-900 max-w-md"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Everything a workshop needs
            </h2>
            <p className="mt-4 text-gray-500 max-w-lg">
              Built around how tailoring businesses actually work, not adapted from generic inventory software.
            </p>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.06}>
                <div className="p-6 rounded-xl shadow-sm bg-white flex flex-col gap-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center bg-gray-100">
                      <feature.icon size={20} className="text-gray-700" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 lg:py-32" style={{ backgroundColor: "#f5f1ee" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <h2
              className="text-3xl lg:text-4xl font-bold text-gray-900 max-w-sm"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Simple to set up
            </h2>
            <p className="mt-4 text-gray-500 max-w-md">
              No lengthy onboarding or implementation projects. You can be tracking orders on the same day you sign up.
            </p>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10">
            {STEPS.map((step, i) => (
              <FadeIn key={step.number} delay={i * 0.08}>
                <div className="space-y-4">
                  <span
                    className="text-5xl font-bold leading-none"
                    style={{ color: "#5fa8a0", fontFamily: "var(--font-canter)" }}
                  >
                    {step.number}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {TESTIMONIAL && (
        <section className="py-24 lg:py-32 bg-white">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <FadeIn>
              <div
                className="rounded-2xl p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center"
                style={{ backgroundColor: "#f5f1ee" }}
              >
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden shrink-0 mx-auto lg:mx-0">
                  <Image
                    src={TESTIMONIAL.image}
                    alt={TESTIMONIAL.name}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <p className="text-lg lg:text-xl text-gray-800 leading-relaxed" style={{ fontFamily: "var(--font-canter)" }}>
                    &ldquo;{TESTIMONIAL.quote}&rdquo;
                  </p>
                  <p className="mt-4 text-sm font-semibold text-gray-900">{TESTIMONIAL.name}</p>
                  <p className="text-sm text-gray-500">{TESTIMONIAL.role}</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* Pricing preview */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <h2
              className="text-3xl lg:text-4xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Straightforward pricing
            </h2>
            <p className="mt-4 text-gray-500 max-w-md">
              Start free and add your team as you grow. You only pay a transaction fee when you sell through the marketplace.
            </p>
          </FadeIn>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-2xl">
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
                    <span className="text-sm text-gray-400 ml-0.5">{plan.period}</span>
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

          <FadeIn className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Selling on the Titunge marketplace carries a {pricing.commissionPercent}% transaction fee on both plans. There are no listing fees.
            </p>
            <Link href="/pricing" className="mt-2 inline-block text-sm text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-4">
              See full pricing details
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-24" style={{ backgroundColor: "#5fa8a0" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <FadeIn>
            <h2
              className="text-3xl lg:text-5xl font-bold text-white mb-6"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Start running a tighter workshop
            </h2>
            <p className="text-white/80 max-w-md mx-auto mb-10">
              Free to start. No credit card required. Add your team only when you&apos;re ready.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white rounded-full px-8 py-4 transition-colors hover:bg-white/10"
              style={{ backgroundColor: "#0e1a18" }}
            >
              Create your workspace
              <ArrowRight size={15} />
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
