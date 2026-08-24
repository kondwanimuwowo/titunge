import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Builds a wa.me deep link. wa.me expects digits only (no +, spaces, or
 *  dashes) with the country code included, strips formatting characters but
 *  doesn't guess a country code, so this only resolves correctly if the
 *  stored phone number already includes one (e.g. "260977123456"). */
export function whatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}
