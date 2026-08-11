import Link from "next/link";
import { Percent, Ruler, Wallet } from "lucide-react";
import { ImagePlaceholder } from "@/components/marketplace/ImagePlaceholder";

const FEATURES = [
  {
    icon: Percent,
    title: "Free to start",
    description: "No listing fees. Titunge takes a 5% commission only when an item sells.",
  },
  {
    icon: Ruler,
    title: "Built for makers",
    description: "List made-to-order pieces with custom measurements, not just off-the-shelf stock.",
  },
  {
    icon: Wallet,
    title: "Get paid your way",
    description: "Weekly payouts by mobile money or bank transfer, in your local currency.",
  },
];

const STATS = [
  { value: "2,400", label: "makers selling" },
  { value: "34", label: "countries reached" },
  { value: "120,000", label: "orders delivered" },
];

export default function SellPage() {
  return (
    <>
      <section className="relative h-[420px] overflow-hidden">
        <ImagePlaceholder shape="rect" className="absolute inset-0 rounded-none" />
        <div
          className="absolute inset-y-0 left-0 w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-12"
          style={{ backgroundColor: "#0e1a18" }}
        >
          <h1 className="text-white text-4xl font-bold leading-[1.1] tracking-tight max-w-lg" style={{ fontFamily: "var(--font-canter)" }}>
            Sell your craft on Titunge
          </h1>
          <p className="mt-4 text-[#c9d4d2] text-base leading-relaxed max-w-md">
            Reach customers across the continent looking for handmade fashion and made-to-order tailoring.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex w-fit text-white text-base font-bold rounded-full px-8 py-3.5 transition-colors hover:bg-[#4f958d]"
            style={{ backgroundColor: "#5fa8a0" }}
          >
            Open your shop
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <feature.icon size={22} className="text-[#0e1a18] mb-4" strokeWidth={1.5} />
              <h3 className="text-base font-bold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: "#f9f7f5" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-extrabold" style={{ fontFamily: "var(--font-canter)" }}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 text-center" style={{ backgroundColor: "#0e1a18" }}>
        <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-canter)" }}>
          Ready to open your shop?
        </h2>
        <p className="mt-4 text-[#c9d4d2] max-w-md mx-auto">It takes a few minutes to set up your first listing.</p>
        <Link
          href="/contact"
          className="mt-8 inline-flex text-[#0e1a18] text-sm font-bold rounded-full px-8 py-3.5 bg-white transition-colors hover:bg-gray-100"
        >
          Start selling
        </Link>
      </section>
    </>
  );
}
