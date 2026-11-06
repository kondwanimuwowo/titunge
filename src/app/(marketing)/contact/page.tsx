import { Mail, MapPin, MessageSquare } from "lucide-react";
import { FadeIn } from "@/components/marketing/FadeIn";
import { ContactForm } from "@/components/marketing/ContactForm";

export const metadata = {
  title: "Contact | Titunge",
  description: "Get in touch with the Titunge team.",
};

export default function ContactPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-36 pb-16" style={{ backgroundColor: "#f5f1ee" }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <h1
              className="text-4xl lg:text-6xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-canter)" }}
            >
              Get in touch
            </h1>
            <p className="mt-4 text-lg text-gray-500 max-w-lg">
              Questions about getting started, selling on the marketplace, or anything else? We read every message.
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
                    <p className="text-sm font-semibold text-gray-900 mb-1">Getting set up</p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Want help moving your workshop onto Titunge? Send us a message and we will walk you through it.
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
              <ContactForm />
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
