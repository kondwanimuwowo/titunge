import Link from "next/link";
import { FadeIn } from "@/components/marketing/FadeIn";
import { ImagePlaceholder } from "./ImagePlaceholder";

export function Hero() {
  return (
    <section className="relative h-[420px] lg:h-[560px] overflow-hidden">
      <ImagePlaceholder
        shape="rect"
        className="absolute inset-0 rounded-none"
        src="/pexels-magapls-2149937712-34164160.jpg"
        alt="Tailor's workshop"
      />
      <div
        className="absolute inset-y-0 left-0 w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-12"
        style={{ backgroundColor: "#0e1a18" }}
      >
        <FadeIn>
          <h1
            className="text-white text-4xl lg:text-[52px] font-bold leading-[1.1] tracking-tight max-w-xl"
            style={{ fontFamily: "var(--font-canter)" }}
          >
            Handmade and tailored, straight from the maker.
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mt-4 text-[#c9d4d2] text-base lg:text-lg leading-relaxed max-w-md">
            Fabric, garments, and custom pieces from independent makers across Africa.
          </p>
        </FadeIn>
        <FadeIn delay={0.18} className="mt-8 flex flex-wrap gap-4">
          <Link
            href="#new"
            className="text-white text-base font-bold rounded-full px-8 py-3.5 transition-colors hover:bg-[#4f958d]"
            style={{ backgroundColor: "#5fa8a0" }}
          >
            Shop now
          </Link>
          <Link
            href="#sell"
            className="bg-white text-[#0e1a18] text-base font-bold rounded-full px-8 py-3.5 transition-colors hover:bg-gray-100"
          >
            Start selling
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
