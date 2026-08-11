import Link from "next/link";

export function ComingSoon({ title }: { title: string }) {
  return (
    <section className="flex flex-col items-center justify-center text-center px-6 py-32">
      <h1
        className="text-3xl lg:text-4xl font-bold text-[#0e1a18]"
        style={{ fontFamily: "var(--font-canter)" }}
      >
        {title}
      </h1>
      <p className="mt-4 text-gray-500 max-w-md">
        This part of the marketplace is coming soon.
      </p>
      <Link
        href="/"
        className="mt-8 text-white text-sm font-semibold rounded-full px-7 py-3 transition-colors hover:bg-[#4f958d]"
        style={{ backgroundColor: "#5fa8a0" }}
      >
        Back to marketplace
      </Link>
    </section>
  );
}
