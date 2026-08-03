import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/marketing/FadeIn";

const VALUES = [
  {
    title: "Built for the work, not around it",
    body: "Most business software is built for retail or services and then stretched to fit tailoring. Titunge was designed from the ground up for workshops that work with custom measurements, production runs, and fabric inventory.",
  },
  {
    title: "Small teams, not enterprises",
    body: "The workshop owner who also does alterations on weekends does not need a system that requires a full-time administrator. We optimize for clarity and speed, not feature count.",
  },
  {
    title: "Your data, your business",
    body: "Every business on Titunge gets its own isolated data environment. We do not use your order or customer data for advertising, benchmarking, or anything beyond running your account.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <FadeIn className="max-w-2xl">
            <h1
              className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Why we built this
            </h1>
          </FadeIn>
        </div>
      </section>

      {/* Story */}
      <section className="pb-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl space-y-6 text-gray-600 text-base leading-relaxed">
            <FadeIn>
              <p>
                Titunge started as an internal tool for a single tailoring workshop. The owner was tracking orders in a shared Google Sheet, customer measurements in a notebook, and payments in a separate file. None of it talked to each other.
              </p>
            </FadeIn>
            <FadeIn delay={0.08}>
              <p>
                The existing options were generic inventory systems that needed significant customization to handle garments, or full ERP platforms with months-long implementations. Neither was realistic for a 3-person workshop.
              </p>
            </FadeIn>
            <FadeIn delay={0.12}>
              <p>
                So we built something specific. An ERP that understands order statuses for custom clothing, tracks material consumption at the batch level, and handles the customer relationship from first inquiry to final fitting.
              </p>
            </FadeIn>
            <FadeIn delay={0.16}>
              <p>
                Titunge is now available to any tailoring or garment business that wants to move off spreadsheets. Each business gets its own workspace, its own data, and its own branded catalog page.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 lg:py-32" style={{ backgroundColor: "#f5f1ee" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <h2
              className="text-3xl font-bold text-gray-900 mb-14"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              What we care about
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {VALUES.map((v, i) => (
              <FadeIn key={v.title} delay={i * 0.08}>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <FadeIn className="max-w-lg">
            <h2
              className="text-3xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Get in touch
            </h2>
            <p className="text-gray-500 mb-8">
              Questions about whether Titunge fits your workshop, or feedback on something we got wrong, reach us at{" "}
              <a href="mailto:hello@titunge.com" className="text-gray-900 underline underline-offset-4 hover:no-underline">
                hello@titunge.com
              </a>
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white rounded-full px-7 py-3.5 transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#5fa8a0" }}
            >
              Start your workspace
              <ArrowRight size={15} />
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
