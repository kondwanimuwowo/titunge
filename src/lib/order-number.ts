import { format } from "date-fns";

/** Workshop order number using the business's own prefix, e.g. "KAY-20261107-4821". */
export function generateOrderNumber(prefix: string, date = new Date()): string {
  const clean = prefix.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "ORD";
  return `${clean}-${format(date, "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`;
}
