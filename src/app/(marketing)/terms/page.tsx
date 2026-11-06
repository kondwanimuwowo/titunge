import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service | Titunge",
  description: "The terms for using Titunge as a buyer, seller, or business.",
};

const SECTIONS = [
  {
    title: "Using Titunge",
    body: "By creating an account or placing an order on Titunge, you agree to these terms. You must be able to form a legally binding contract to use the marketplace.",
  },
  {
    title: "Buyers",
    body: "Orders placed through the marketplace are contracts between you and the individual seller. Titunge facilitates the transaction and payment but is not the seller of record for marketplace items.",
  },
  {
    title: "Sellers",
    body: "Sellers are responsible for the accuracy of their listings, fulfilling orders within the stated lead time, and complying with applicable consumer protection and trade laws. Titunge charges a commission on completed sales, as described at the point of listing.",
  },
  {
    title: "Payments",
    body: "Payments are processed by Titunge through its payment partner, Lenco. Seller payouts are released automatically once an order has been marked delivered and a short dispute window has passed.",
  },
  {
    title: "Prohibited items and conduct",
    body: "You may not list counterfeit goods, misrepresent an item's condition or origin, or use the marketplace for any unlawful purpose.",
  },
  {
    title: "Limitation of liability",
    body: "Titunge provides the marketplace on an as-is basis and is not liable for disputes between buyers and sellers beyond facilitating resolution in good faith.",
  },
  {
    title: "Changes to these terms",
    body: "We may update these terms from time to time. Continued use of Titunge after a change constitutes acceptance of the updated terms.",
  },
  {
    title: "Contact",
    body: "Questions about these terms can be sent to legal@titunge.com.",
  },
];

export default function TermsPage() {
  return (
    <section className="max-w-3xl mx-auto px-6 lg:px-8 py-24">
      <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "var(--font-canter)" }}>
        Terms of service
      </h1>
      <p className="text-sm text-gray-400 mb-12">Last updated August 2026</p>

      <div className="flex flex-col gap-10">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
