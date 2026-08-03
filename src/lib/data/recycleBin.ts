import { getDeletedEmployees } from "./employees";
import { getDeletedCustomers } from "./customers";
import { getDeletedProducts } from "./products";
import { getDeletedMaterials } from "./inventory";
import { getDeletedOrders } from "./orders";
import { getDeletedBatches } from "./production";

export type RecycleBinType =
  | "employee"
  | "customer"
  | "product"
  | "material"
  | "order"
  | "production_batch";

export interface RecycleBinItem {
  id: string;
  type: RecycleBinType;
  title: string;
  subtitle: string;
  deletedAt: string | null;
}

export async function getRecycleBinItems(businessId: string): Promise<RecycleBinItem[]> {
  const [employees, customers, products, materials, orders, batches] = await Promise.all([
    getDeletedEmployees(businessId),
    getDeletedCustomers(businessId),
    getDeletedProducts(businessId),
    getDeletedMaterials(businessId),
    getDeletedOrders(businessId),
    getDeletedBatches(businessId),
  ]);

  const items: RecycleBinItem[] = [
    ...employees.map((e: any) => ({
      id: e.id,
      type: "employee" as const,
      title: e.name,
      subtitle: e.role || "Employee",
      deletedAt: e.updated_at,
    })),
    ...customers.map((c: any) => ({
      id: c.id,
      type: "customer" as const,
      title: c.name,
      subtitle: [c.phone, c.email].filter(Boolean).join(" · ") || "No contact info",
      deletedAt: c.deleted_at,
    })),
    ...products.map((p: any) => ({
      id: p.id,
      type: "product" as const,
      title: p.name,
      subtitle: `${p.category || "Uncategorised"} · K${parseFloat(String(p.base_price || 0)).toFixed(2)}`,
      deletedAt: p.deleted_at,
    })),
    ...materials.map((m: any) => ({
      id: m.id,
      type: "material" as const,
      title: m.name,
      subtitle: `${m.category || "Uncategorised"} · ${m.unit}`,
      deletedAt: m.deleted_at,
    })),
    ...orders.map((o: any) => ({
      id: o.id,
      type: "order" as const,
      title: o.order_number,
      subtitle: `${o.customers?.name || "Walk-in customer"} · ${o.status}`,
      deletedAt: o.deleted_at,
    })),
    ...batches.map((b: any) => ({
      id: b.id,
      type: "production_batch" as const,
      title: b.batch_number,
      subtitle: `${b.products?.name || "Unknown product"} · ${b.status}`,
      deletedAt: b.deleted_at,
    })),
  ];

  return items.sort(
    (a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime()
  );
}
