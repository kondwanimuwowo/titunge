import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { weightedScore, recencyBonus, sanitizeForFilter } from "@/lib/search/score";

export const dynamic = "force-dynamic";

interface ResultItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
  badge?: string;
}

interface ResultGroup {
  type: string;
  label: string;
  items: ResultItem[];
}

const PER_GROUP_LIMIT = 5;
const PER_QUERY_LIMIT = 8;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("q") || "").trim();

  if (raw.length < 2) {
    return NextResponse.json({ query: raw, groups: [] });
  }

  const safe = sanitizeForFilter(raw);
  if (!safe) {
    return NextResponse.json({ query: raw, groups: [] });
  }
  const digits = raw.replace(/\D/g, "");

  const supabase = await createClient();

  const [ordersRes, customersRes, productsRes, materialsRes, employeesRes, inquiriesRes] = await Promise.all([
    (supabase.from("orders") as any)
      .select("id, order_number, description, status, total_cost, created_at, customers(name, phone)")
      .or(`order_number.ilike.%${safe}%,description.ilike.%${safe}%,notes.ilike.%${safe}%`)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(PER_QUERY_LIMIT),
    (supabase.from("customers") as any)
      .select("id, name, phone, email, created_at")
      .or(
        `name.ilike.%${safe}%,phone.ilike.%${safe}%,email.ilike.%${safe}%${
          digits ? `,phone.ilike.%${digits}%` : ""
        }`
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(PER_QUERY_LIMIT),
    (supabase.from("products") as any)
      .select("id, name, category, base_price, created_at")
      .or(`name.ilike.%${safe}%,category.ilike.%${safe}%,description.ilike.%${safe}%`)
      .is("deleted_at", null)
      .limit(PER_QUERY_LIMIT),
    (supabase.from("materials") as any)
      .select("id, name, category, unit, stock_quantity, supplier, created_at")
      .or(`name.ilike.%${safe}%,category.ilike.%${safe}%,supplier.ilike.%${safe}%`)
      .is("deleted_at", null)
      .limit(PER_QUERY_LIMIT),
    (supabase.from("employees") as any)
      .select("id, name, role, phone, email, created_at")
      .or(`name.ilike.%${safe}%,role.ilike.%${safe}%,phone.ilike.%${safe}%,email.ilike.%${safe}%`)
      .eq("active", true)
      .limit(PER_QUERY_LIMIT),
    (supabase.from("customer_inquiries") as any)
      .select("id, customer_name, customer_phone, status, created_at")
      .or(`customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%`)
      .order("created_at", { ascending: false })
      .limit(PER_QUERY_LIMIT),
  ]);

  const groups: ResultGroup[] = [];

  // Orders
  const orderItems: ResultItem[] = (ordersRes.data || []).map((o: any) => {
    const score =
      weightedScore(
        [
          [o.order_number, 1],
          [o.customers?.name, 0.7],
          [o.description, 0.5],
        ],
        raw
      ) + recencyBonus(o.created_at);
    return {
      id: o.id,
      title: o.order_number,
      subtitle: `${o.customers?.name || "Walk-in"} · K${parseFloat(o.total_cost || 0).toFixed(2)} · ${o.status}`,
      href: `/orders/${o.id}`,
      score,
      badge: o.status,
    };
  });
  if (orderItems.length) {
    groups.push({
      type: "orders",
      label: "Orders",
      items: orderItems.sort((a, b) => b.score - a.score).slice(0, PER_GROUP_LIMIT),
    });
  }

  // Customers
  const customerItems: ResultItem[] = (customersRes.data || []).map((c: any) => {
    const score =
      weightedScore(
        [
          [c.name, 1],
          [c.phone, 0.9],
          [c.email, 0.7],
        ],
        raw
      ) + recencyBonus(c.created_at);
    return {
      id: c.id,
      title: c.name,
      subtitle: [c.phone, c.email].filter(Boolean).join(" · ") || "No contact info",
      href: `/customers/${c.id}`,
      score,
    };
  });
  if (customerItems.length) {
    groups.push({
      type: "customers",
      label: "Customers",
      items: customerItems.sort((a, b) => b.score - a.score).slice(0, PER_GROUP_LIMIT),
    });
  }

  // Products
  const productItems: ResultItem[] = (productsRes.data || []).map((p: any) => {
    const score = weightedScore(
      [
        [p.name, 1],
        [p.category, 0.6],
      ],
      raw
    );
    return {
      id: p.id,
      title: p.name,
      subtitle: `${p.category || "Uncategorised"} · K${parseFloat(p.base_price || 0).toFixed(2)}`,
      href: `/products/${p.id}`,
      score,
    };
  });
  if (productItems.length) {
    groups.push({
      type: "products",
      label: "Products",
      items: productItems.sort((a, b) => b.score - a.score).slice(0, PER_GROUP_LIMIT),
    });
  }

  // Materials
  const materialItems: ResultItem[] = (materialsRes.data || []).map((m: any) => {
    const score = weightedScore(
      [
        [m.name, 1],
        [m.category, 0.6],
        [m.supplier, 0.5],
      ],
      raw
    );
    return {
      id: m.id,
      title: m.name,
      subtitle: `${m.category || "Uncategorised"} · ${parseFloat(m.stock_quantity || 0).toFixed(1)} ${m.unit} in stock`,
      href: `/inventory/materials/${m.id}`,
      score,
    };
  });
  if (materialItems.length) {
    groups.push({
      type: "materials",
      label: "Materials",
      items: materialItems.sort((a, b) => b.score - a.score).slice(0, PER_GROUP_LIMIT),
    });
  }

  // Employees
  const employeeItems: ResultItem[] = (employeesRes.data || []).map((e: any) => {
    const score = weightedScore(
      [
        [e.name, 1],
        [e.role, 0.6],
        [e.phone, 0.5],
      ],
      raw
    );
    return {
      id: e.id,
      title: e.name,
      subtitle: e.role || "Employee",
      href: `/employees/${e.id}`,
      score,
    };
  });
  if (employeeItems.length) {
    groups.push({
      type: "employees",
      label: "Employees",
      items: employeeItems.sort((a, b) => b.score - a.score).slice(0, PER_GROUP_LIMIT),
    });
  }

  // Inquiries
  const inquiryItems: ResultItem[] = (inquiriesRes.data || []).map((i: any) => {
    const score =
      weightedScore(
        [
          [i.customer_name, 1],
          [i.customer_phone, 0.9],
        ],
        raw
      ) + recencyBonus(i.created_at);
    return {
      id: i.id,
      title: i.customer_name,
      subtitle: `${i.customer_phone || ""} · ${i.status}`,
      href: `/inquiries/${i.id}`,
      score,
      badge: i.status,
    };
  });
  if (inquiryItems.length) {
    groups.push({
      type: "inquiries",
      label: "Inquiries",
      items: inquiryItems.sort((a, b) => b.score - a.score).slice(0, PER_GROUP_LIMIT),
    });
  }

  // Drop zero-score noise, then rank groups by their strongest match
  const cleaned = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.score > 0) }))
    .filter((g) => g.items.length > 0)
    .sort((a, b) => b.items[0].score - a.items[0].score);

  return NextResponse.json({ query: raw, groups: cleaned });
}
