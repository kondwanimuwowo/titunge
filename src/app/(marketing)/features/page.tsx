import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardList, Box, Users, Scissors, Wallet, BarChart3,
  FileText, UserCog, Store, ArrowRight,
} from "lucide-react";
import { FadeIn } from "@/components/marketing/FadeIn";

export const metadata: Metadata = {
  title: "Features | Titunge",
  description: "Orders, measurements, production, inventory, finance, and a marketplace shop, built for tailoring and garment businesses.",
};

const MODULES = [
  {
    icon: ClipboardList,
    name: "Orders",
    tagline: "Track every order from first contact to pickup",
    details: [
      "Create orders for walk-in customers or convert a customer's question into an order",
      "Set due dates and move orders through each stage of production",
      "Record measurements and special instructions per order",
      "Suggested pricing from your material costs, overheads, and margin",
      "Email receipts and quotations to customers",
    ],
  },
  {
    icon: Users,
    name: "Customers",
    tagline: "Every client's measurements and history in one place",
    details: [
      "28 tailoring measurements per customer, from shoulder to calf",
      "Full order history for every client",
      "Internal notes visible only to your team",
      "Find any customer by name and export your list to CSV",
    ],
  },
  {
    icon: Box,
    name: "Inventory",
    tagline: "Know exactly what you have before you make a promise",
    details: [
      "Track fabric, thread, buttons, and any other material by quantity",
      "Set a minimum stock level and get an alert when you fall below it",
      "Record purchase costs and see the value of the stock you hold",
      "Full stock history and audit for every material",
    ],
  },
  {
    icon: Scissors,
    name: "Production",
    tagline: "Manage how work moves through your workshop",
    details: [
      "Create production batches for ready-made stock",
      "Materials are deducted from inventory automatically",
      "Finished pieces are added to stock when a batch is completed",
      "Staff are notified when a batch is done",
    ],
  },
  {
    icon: Wallet,
    name: "Finance",
    tagline: "A clear picture of money in and money out",
    details: [
      "Record full and partial payments against orders",
      "See who still owes you with receivables tracking",
      "Log expenses and recurring overheads like rent and salaries",
      "Profit per order and garment-type costing",
      "Export financial data to CSV",
    ],
  },
  {
    icon: BarChart3,
    name: "Analytics",
    tagline: "Understand what is driving your business",
    details: [
      "Revenue and profitability over time",
      "Order status breakdown and top customers",
      "Material usage and inventory turnover",
      "Employee productivity, plus marketplace sales in the same place",
    ],
  },
  {
    icon: FileText,
    name: "Quotes and invoices",
    tagline: "Professional documents in a couple of clicks",
    details: [
      "Create quotations and invoices for any customer",
      "Email them directly from Titunge",
      "Track which documents are drafts, sent, or paid",
    ],
  },
  {
    icon: UserCog,
    name: "Team",
    tagline: "Bring your staff in when you're ready",
    details: [
      "Invite staff by email with admin, manager, or employee roles",
      "Each role only sees what it needs to",
      "Employee records and daily clock-in and clock-out",
    ],
  },
  {
    icon: Store,
    name: "Marketplace shop",
    tagline: "Sell to customers across Zambia",
    details: [
      "Your own shop page on the Titunge marketplace",
      "Products with a photo are listed automatically",
      "Buyers pay by mobile money; you're paid automatically after delivery",
      "Customers can ask you questions, which arrive as inquiries in your workspace",
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
