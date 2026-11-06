import { MessageCircle, Phone } from "lucide-react";
import { whatsappLink } from "@/lib/utils";
import type { MarketplaceOrder } from "@/data/marketplace-orders";

function toZambianIntl(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return digits.startsWith("0") && digits.length === 10 ? `260${digits.slice(1)}` : digits;
}

/** Paid orders only: who the buyer contacts to arrange delivery or collection. */
export function SellerContacts({ order }: { order: MarketplaceOrder }) {
  if (order.paymentStatus !== "successful" || order.sellers.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-3">
      <div>
        <p className="text-sm font-bold">Arrange delivery or collection</p>
        <p className="text-xs text-gray-500 mt-0.5">
          The seller will contact you. You can also reach them directly about order {order.id}.
        </p>
      </div>
      {order.sellers.map((seller) => (
        <div key={seller.name} className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold">{seller.name}</span>
          {seller.phone ? (
            <span className="flex items-center gap-4">
              <a href={`tel:${seller.phone}`} className="inline-flex items-center gap-1 text-[#0e1a18] hover:text-[#5fa8a0]">
                <Phone size={14} /> {seller.phone}
              </a>
              <a
                href={whatsappLink(toZambianIntl(seller.phone), `Hi ${seller.name}, I'm getting in touch about my Titunge order ${order.id}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#0e1a18] hover:text-[#5fa8a0]"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </span>
          ) : (
            <span className="text-xs text-gray-500">They&apos;ll contact you on the number you gave.</span>
          )}
        </div>
      ))}
    </div>
  );
}
