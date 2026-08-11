const SECTIONS = [
  {
    title: "Information we collect",
    body: "We collect information you provide directly, such as your name, contact details, shipping address, and order history when you use Titunge as a shopper or seller. We also collect basic usage data, such as pages visited and actions taken on the site, to help us improve the product.",
  },
  {
    title: "How we use your information",
    body: "We use your information to process orders, connect buyers with sellers, provide customer support, and communicate updates about your account or orders. We do not sell your personal information to third parties.",
  },
  {
    title: "Sharing with sellers and service providers",
    body: "When you place an order, we share the information necessary to fulfil it (such as your name and delivery address) with the relevant seller. We also work with payment and delivery partners who process data on our behalf, under agreements that limit their use of it.",
  },
  {
    title: "Cookies",
    body: "We use cookies and similar technologies to keep you signed in, remember your preferences, and understand how the site is used. You can control cookies through your browser settings.",
  },
  {
    title: "Data retention and security",
    body: "We retain account and order information for as long as needed to provide our services and meet legal obligations, and take reasonable technical and organisational measures to protect it.",
  },
  {
    title: "Your rights",
    body: "You may request access to, correction of, or deletion of your personal information by contacting us using the details below.",
  },
  {
    title: "Contact",
    body: "Questions about this policy can be sent to privacy@titunge.com.",
  },
];

export default function PrivacyPage() {
  return (
    <section className="max-w-3xl mx-auto px-6 lg:px-8 py-24">
      <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "var(--font-canter)" }}>
        Privacy policy
      </h1>
      <p className="text-sm text-gray-400 mb-12">Last updated August 2026 &middot; This is placeholder content and has not been reviewed by legal counsel.</p>

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
