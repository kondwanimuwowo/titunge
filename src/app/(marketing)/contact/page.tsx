import { Mail, MapPin, MessageSquare } from "lucide-react";
import { FadeIn } from "@/components/marketing/FadeIn";

export const metadata = {
  title: "Contact — Titunge",
  description: "Get in touch with the Titunge team.",
};

export default function ContactPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16" style={{ backgroundColor: "#f5f1ee" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <h1
              className="text-4xl lg:text-6xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Get in touch
            </h1>
            <p className="mt-4 text-lg text-gray-500 max-w-lg">
              Questions about Enterprise pricing, a partnership, or anything else — we read every message.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact details */}
            <FadeIn>
              <div className="space-y-10">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: "#f5f1ee" }}
                  >
                    <Mail size={18} style={{ color: "#5fa8a0" }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Email</p>
                    <a
                      href="mailto:hello@titunge.com"
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      hello@titunge.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: "#f5f1ee" }}
                  >
                    <MessageSquare size={18} style={{ color: "#5fa8a0" }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Enterprise sales</p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Interested in the Enterprise plan? Send us a message and we will walk you through a demo and pricing options tailored to your operation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: "#f5f1ee" }}
                  >
                    <MapPin size={18} style={{ color: "#5fa8a0" }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Based in</p>
                    <p className="text-sm text-gray-500">Lusaka, Zambia</p>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Form */}
            <FadeIn delay={0.1}>
              <form
                action="mailto:hello@titunge.com"
                method="get"
                encType="text/plain"
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-gray-900">
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Your name"
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/20 focus:border-[#5fa8a0] transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-gray-900">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@company.com"
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/20 focus:border-[#5fa8a0] transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-sm font-medium text-gray-900">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/20 focus:border-[#5fa8a0] transition-all text-gray-700"
                  >
                    <option value="Enterprise pricing">Enterprise pricing</option>
                    <option value="General question">General question</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Technical support">Technical support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-sm font-medium text-gray-900">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="body"
                    required
                    rows={5}
                    placeholder="Tell us about your business and what you need..."
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/20 focus:border-[#5fa8a0] transition-all placeholder:text-gray-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full text-sm font-semibold text-white rounded-full px-6 py-3 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#5fa8a0" }}
                >
                  Send message
                </button>
              </form>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
