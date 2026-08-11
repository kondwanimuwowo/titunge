import Link from "next/link";
import { MARKETPLACE_SELLERS } from "@/data/marketplace-sellers";
import { ImagePlaceholder } from "./ImagePlaceholder";

export function MakerSpotlight() {
  return (
    <section className="py-16" style={{ backgroundColor: "#f9f7f5" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-8">Makers behind the work</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MARKETPLACE_SELLERS.map((seller) => (
            <div
              key={seller.slug}
              className="bg-white rounded-xl shadow-[0_2px_12px_rgba(14,26,24,0.08)] p-8 flex flex-col items-center text-center gap-2"
            >
              <ImagePlaceholder shape="circle" className="w-24 h-24" />
              <div className="text-lg font-bold mt-2">{seller.name}</div>
              <div className="text-sm text-gray-500">{seller.location}</div>
              <div className="text-sm leading-relaxed">{seller.bio}</div>
              <div className="text-[13px] text-gray-500">{seller.itemCount} items</div>
              <Link
                href={`/shop/${seller.slug}`}
                className="mt-2 text-white text-sm font-semibold rounded-full px-6 py-2.5 transition-colors hover:bg-[#1c2f2c]"
                style={{ backgroundColor: "#0e1a18" }}
              >
                Visit shop
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
