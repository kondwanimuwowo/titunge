import Link from "next/link";
import {
  ClipboardList, Box, Users, Scissors, Wallet, BarChart3,
  MessageSquare, Bell, Package, ArrowRight,
} from "lucide-react";
import { FadeIn } from "@/components/marketing/FadeIn";

const MODULES = [
  {
    icon: ClipboardList,
    name: "Orders",
    tagline: "Track every order from first contact to pickup",
    details: [
      "Create orders from walk-ins or convert inquiries",
      "Set due dates and monitor status through your production queue",
      "Record measurements and special instructions per order",
      "Print or share order receipts with customers",
      "Cancel or archive orders with a full audit trail",
    ],
  },
  {
    icon: Box,
    name: "Inventory",
    tagline: "Know exactly what you have before you make a promise",
    details: [
      "Track fabrics, threads, buttons, and any other materials by quantity",
      "Set low-stock alerts so you reorder before you run out",
      "Record purchase costs and calculate material value in stock",
      "Log manual stock adjustments with notes",
      "View full transaction history per material",
    ],
  },
  {
    icon: Users,
    name: "Customers",
    tagline: "Every client's history in one place",
    details: [
      "Store contact details and body measurements per customer",
      "See a complete order history for any client in seconds",
      "Add internal notes visible only to your team",
      "Search customers by name, phone, or email",
    ],
  },
  {
    icon: Scissors,
    name: "Production",
    tagline: "Manage how work moves through your workshop",
    details: [
      "Create production batches and assign orders to them",
      "Track material consumption per batch",
      "Mark batches complete and automatically update inventory",
      "Log production events with notes",
    ],
  },
  {
    icon: Wallet,
    name: "Finance",
    tagline: "A clear picture of money in and money out",
    details: [
      "Record full and partial payments against orders",
      "Log overhead costs: rent, utilities, salaries",
      "Track expenses by category",
      "See revenue, expenses, and outstanding balances by date range",
      "Export financial data to CSV",
    ],
  },
  {
    icon: BarChart3,
    name: "Analytics",
    tagline: "Understand what is driving your business",
    details: [
      "Revenue and order volume over time",
      "Top-selling products and garment types",
      "Busiest months and seasonal patterns",
      "Customer retention and repeat-order rate",
    ],
  },
  {
    icon: MessageSquare,
    name: "Inquiries",
    tagline: "Capture interest before it becomes an order",
    details: [
      "Receive inquiries from your public catalog page",
      "Convert inquiries to orders with one click",
      "Track which inquiries are still open",
      "See inquiry volume by product",
    ],
  },
  {
    icon: Package,
    name: "Product catalog",
    tagline: "A public page showing what you make",
    details: [
      "Each business gets a public catalog at their own subdomain",
      "Customers can browse products and submit inquiries",
      "Inquiries flow directly into the ERP",
      "Customize with your business logo and brand colors",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-36 pb-20" style={{ backgroundColor: "#0e1a18" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <h1
              className="text-4xl lg:text-6xl font-bold text-white leading-tight"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Built for how tailors work
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-5 text-lg text-gray-400 max-w-xl">
              Titunge covers every part of running a garment workshop, from taking a measurement to reconciling your monthly revenue.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Module list */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 space-y-20">
          {MODULES.map((mod, i) => (
            <FadeIn key={mod.name}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <mod.icon size={20} className="text-gray-700" strokeWidth={1.5} />
                    <h2
                      className="text-2xl font-bold text-gray-900"
                      style={{ fontFamily: "var(--font-canter)" }}
                    >
                      {mod.name}
                    </h2>
                  </div>
                  <p className="text-gray-500 text-base">{mod.tagline}</p>
                </div>
                <ul className="space-y-3">
                  {mod.details.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: "#5fa8a0" }} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              {i < MODULES.length - 1 && <div className="mt-20 h-px bg-gray-100" />}
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ backgroundColor: "#f5f1ee" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <FadeIn>
            <h2
              className="text-3xl lg:text-4xl font-bold text-gray-900 mb-5"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Ready to try it?
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Start free. No credit card, no long setup process.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white rounded-full px-8 py-4 transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#5fa8a0" }}
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
