import Link from "next/link";

export function DualCta() {
  return (
    <section id="sell" className="grid grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col items-start gap-4 px-8 lg:px-16 py-16" style={{ backgroundColor: "#0e1a18" }}>
        <h2 className="text-white text-2xl lg:text-3xl font-extrabold tracking-tight">Sell your craft</h2>
        <p className="text-[#c9d4d2] text-base leading-relaxed max-w-md">
          Open a shop on Titunge and reach customers across the continent. Listing is free and you keep control of your prices.
        </p>
        <Link
          href="/sell"
          className="mt-2 bg-white text-[#0e1a18] text-sm font-bold rounded-full px-7 py-3 transition-colors hover:bg-gray-100"
        >
          Start selling
        </Link>
      </div>
      <div className="flex flex-col items-start gap-4 px-8 lg:px-16 py-16" style={{ backgroundColor: "#5fa8a0" }}>
        <h2 className="text-white text-2xl lg:text-3xl font-extrabold tracking-tight">Run your business</h2>
        <p className="text-[#eef5f4] text-base leading-relaxed max-w-md">
          Titunge for Business tracks orders, measurements, inventory, and payments for your tailoring shop.
        </p>
        <Link
          href="/business"
          className="mt-2 text-white text-sm font-bold rounded-full px-7 py-3 transition-colors hover:bg-[#1c2f2c]"
          style={{ backgroundColor: "#0e1a18" }}
        >
          Go to Titunge for Business
        </Link>
      </div>
    </section>
  );
}
