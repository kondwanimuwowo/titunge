import Link from "next/link";
import { BarChart3, Box, ShoppingBag, Users, Scissors, Wallet, ClipboardList, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/marketing/FadeIn";

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

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-36" style={{ backgroundColor: "#0e1a18" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
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
              Start for free
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center text-sm font-medium text-gray-300 rounded-full px-7 py-3.5 border border-gray-700 hover:border-gray-500 transition-colors"
            >
              See all features
            </Link>
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
                <div className="p-6 rounded-xl shadow-sm bg-white" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <feature.icon size={22} className="text-gray-700 mb-4" strokeWidth={1.5} />
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
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
              Start free. Upgrade when you need more users or higher order volume.
            </p>
          </FadeIn>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                plan: "Starter",
                price: "Free",
                period: "forever",
                description: "For workshops just getting started with digital record-keeping.",
                items: ["Up to 50 orders per month", "1 user account", "Orders, customers, inventory", "Email support"],
                cta: "Get started",
                featured: false,
              },
              {
                plan: "Growth",
                price: "$29",
                period: "per month",
                description: "For workshops running a steady volume of orders with a small team.",
                items: ["Unlimited orders", "Up to 5 users", "All modules including analytics", "Public catalog app", "Priority support"],
                cta: "Start free trial",
                featured: true,
              },
              {
                plan: "Scale",
                price: "$79",
                period: "per month",
                description: "For larger operations with multiple tailors or multiple locations.",
                items: ["Unlimited orders and users", "Multiple locations", "Custom subdomain", "Dedicated support"],
                cta: "Get started",
                featured: false,
              },
            ].map((tier, i) => (
              <FadeIn key={tier.plan} delay={i * 0.08}>
                <div
                  className="rounded-xl p-7 flex flex-col h-full"
                  style={{
                    backgroundColor: tier.featured ? "#0e1a18" : "white",
                    boxShadow: tier.featured
                      ? "0 8px 32px rgba(14,26,24,0.2)"
                      : "0 2px 12px rgba(0,0,0,0.06)",
                  }}
                >
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${tier.featured ? "text-[#5fa8a0]" : "text-gray-400"}`}>
                      {tier.plan}
                    </p>
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span
                        className={`text-4xl font-bold ${tier.featured ? "text-white" : "text-gray-900"}`}
                        style={{ fontFamily: "var(--font-canter)" }}
                      >
                        {tier.price}
                      </span>
                      {tier.period !== "forever" && (
                        <span className={`text-sm ${tier.featured ? "text-gray-400" : "text-gray-400"}`}>{tier.period}</span>
                      )}
                    </div>
                    <p className={`text-sm mt-3 leading-relaxed mb-6 ${tier.featured ? "text-gray-400" : "text-gray-500"}`}>
                      {tier.description}
                    </p>
                    <ul className="space-y-2.5">
                      {tier.items.map((item) => (
                        <li key={item} className={`text-sm flex items-center gap-2.5 ${tier.featured ? "text-gray-300" : "text-gray-600"}`}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#5fa8a0" }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-8">
                    <Link
                      href="/onboarding"
                      className="block w-full text-center text-sm font-semibold rounded-full px-6 py-3 transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: tier.featured ? "#5fa8a0" : "#f5f1ee",
                        color: tier.featured ? "white" : "#0e1a18",
                      }}
                    >
                      {tier.cta}
                    </Link>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="mt-8 text-center">
            <Link href="/pricing" className="text-sm text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-4">
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
              Free to start. No credit card required. Your data stays yours.
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
