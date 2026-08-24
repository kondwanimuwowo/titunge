import Link from "next/link";
import { Store, LayoutDashboard, ArrowRight } from "lucide-react";

const CARDS = [
  {
    icon: Store,
    accent: "#5fa8a0",
    title: "Sell your craft",
    description:
      "Open a shop on Titunge and reach customers across the continent. Listing is free and you keep control of your prices.",
    href: "/sell",
    cta: "Start selling",
  },
  {
    icon: LayoutDashboard,
    accent: "#0e1a18",
    title: "Run your business",
    description:
      "Titunge for Business tracks orders, measurements, inventory, and payments for your tailoring shop.",
    href: "/business",
    cta: "Go to Titunge for Business",
  },
];

export function DualCta() {
  return (
    <section id="sell" className="py-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-8">Ways to get started</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-[0_2px_12px_rgba(14,26,24,0.08)] p-8 lg:p-10 flex flex-col items-start gap-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${card.accent}1a` }}
                >
                  <card.icon size={22} style={{ color: card.accent }} strokeWidth={1.75} />
                </div>
                <h3 className="text-xl lg:text-2xl font-extrabold tracking-tight">{card.title}</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
              <Link
                href={card.href}
                className="mt-auto inline-flex items-center gap-2 text-white text-sm font-bold rounded-full px-6 py-3 transition-opacity hover:opacity-90"
                style={{ backgroundColor: card.accent }}
              >
                {card.cta}
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
