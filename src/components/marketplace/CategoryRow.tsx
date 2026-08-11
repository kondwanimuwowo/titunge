import Link from "next/link";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace-categories";

export function CategoryRow() {
  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {MARKETPLACE_CATEGORIES.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="shrink-0 flex flex-col items-center gap-3 bg-gray-100 rounded-xl px-8 py-6 min-w-[120px] text-[#0e1a18] transition-colors hover:bg-gray-200"
            >
              <category.icon size={24} strokeWidth={1.5} />
              <span className="text-sm font-semibold whitespace-nowrap">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
