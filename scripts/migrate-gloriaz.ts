/**
 * One-time migration: Gloria'z Daughter → Titunge
 *
 * Usage:
 *   GD_SERVICE_ROLE_KEY=<key> SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/migrate-gloriaz.ts
 *
 * Safe to re-run — skips tables that already have rows for gloriaz-daughter.
 */

import { createClient } from "@supabase/supabase-js";

const GD_URL = "https://afdfokrbygethpoefglq.supabase.co";
const GD_KEY = process.env.GD_SERVICE_ROLE_KEY!;

const TT_URL = "https://pyvclwqticdylasxnetn.supabase.co";
const TT_KEY = process.env.TT_SERVICE_ROLE_KEY!;

if (!GD_KEY || !TT_KEY) {
  console.error("Missing env vars. Need: GD_SERVICE_ROLE_KEY, TT_SERVICE_ROLE_KEY");
  process.exit(1);
}

const gd = createClient(GD_URL, GD_KEY, { auth: { persistSession: false } });
const tt = createClient(TT_URL, TT_KEY, { auth: { persistSession: false } });

const BUSINESS_SLUG = "gloriaz-daughter";

async function fetchAll<T>(client: ReturnType<typeof createClient<any>>, table: string): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await client.from(table).select("*").range(from, from + PAGE - 1);
    if (error) throw new Error(`Fetch ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as T[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

async function insert(table: string, rows: Record<string, unknown>[], label: string) {
  if (rows.length === 0) { console.log(`  ${label}: 0 rows, skipping`); return; }
  const { error } = await tt.from(table).upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`Insert ${table}: ${error.message}`);
  console.log(`  ${label}: ${rows.length} rows`);
}

async function main() {
  console.log("Starting Gloria'z Daughter → Titunge migration\n");

  // ── 1. Business record ──────────────────────────────────────────────────────
  console.log("1. Business record");
  const { data: existing } = await tt.from("businesses").select("id").eq("slug", BUSINESS_SLUG).maybeSingle();
  let BUSINESS_ID: string;
  if (existing) {
    BUSINESS_ID = existing.id;
    console.log(`  Found existing business: ${BUSINESS_SLUG} (${BUSINESS_ID})`);
  } else {
    const { data: created, error: bizError } = await tt.from("businesses").insert({
      name: "Gloria'z Daughter",
      slug: BUSINESS_SLUG,
      order_prefix: "GD",
      currency: "ZMW",
      timezone: "Africa/Lusaka",
      theme_key: "titunge-teal",
      plan: "starter",
      status: "active",
    }).select("id").single();
    if (bizError || !created) throw new Error(`Business insert: ${bizError?.message}`);
    BUSINESS_ID = created.id;
    console.log(`  Created business: ${BUSINESS_SLUG} (${BUSINESS_ID})`);
  }
  console.log();

  const B = BUSINESS_ID;

  // ── 2. Garment types ────────────────────────────────────────────────────────
  console.log("2. Garment types");
  const garmentTypes = await fetchAll<Record<string, unknown>>(gd, "garment_types");
  await insert("garment_types", garmentTypes.map(r => ({
    id: r.id,
    business_id: B,
    name: r.name,
    description: null,
    base_labour_cost: r.base_labour_cost ?? 0,
    estimated_hours: r.estimated_hours ?? null,
    complexity: r.complexity ?? "standard",
    active: r.active ?? true,
    created_at: r.created_at,
    updated_at: r.updated_at,
  })), "garment_types");
  console.log();

  // ── 3. Products ─────────────────────────────────────────────────────────────
  console.log("3. Products");
  const products = await fetchAll<Record<string, unknown>>(gd, "products");
  await insert("products", products.map(r => ({
    id: r.id,
    business_id: B,
    name: r.name,
    description: r.description ?? null,
    price: r.base_price ?? 0,
    category: r.category ?? null,
    product_type: "finished_good",
    sizes: [],
    colors: [],
    images: r.gallery_images
      ? (r.gallery_images as string[]).map((url: string) => url)
      : (r.image_url ? [r.image_url] : []),
    stock_quantity: 0,
    active: r.active ?? true,
    created_at: r.created_at,
    updated_at: r.updated_at,
  })), "products");
  console.log();

  // ── 4. Materials (raw materials only) ───────────────────────────────────────
  console.log("4. Materials");
  const materials = await fetchAll<Record<string, unknown>>(gd, "materials");
  const rawMaterials = materials.filter(m => m.material_type !== "finished_product");
  await insert("materials", rawMaterials.map(r => ({
    id: r.id,
    business_id: B,
    name: r.name,
    unit: r.unit ?? "metres",
    stock_quantity: r.stock_quantity ?? 0,
    min_stock_level: r.min_stock_level ?? 0,
    unit_cost: r.cost_per_unit ?? 0,
    supplier: r.supplier ?? null,
    notes: r.description ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  })), "materials (raw only)");
  console.log();

  // ── 5. Customers ────────────────────────────────────────────────────────────
  console.log("5. Customers");
  const customers = await fetchAll<Record<string, unknown>>(gd, "customers");
  await insert("customers", customers.map(r => ({
    id: r.id,
    business_id: B,
    name: r.name,
    phone: r.phone,
    email: r.email ?? null,
    address: r.address ?? null,
    notes: r.notes ?? null,
    measurements: r.measurements ?? {},
    created_at: r.created_at,
    updated_at: r.updated_at,
  })), "customers");
  console.log();

  // ── 6. Employees ────────────────────────────────────────────────────────────
  console.log("6. Employees");
  const employees = await fetchAll<Record<string, unknown>>(gd, "employees");
  await insert("employees", employees.map(r => ({
    id: r.id,
    business_id: B,
    name: r.name,
    role: r.role ?? null,
    phone: r.phone ?? null,
    email: r.email ?? null,
    hire_date: r.hire_date ?? null,
    hourly_rate: r.hourly_rate ?? 0,
    active: r.active ?? true,
    notes: null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  })), "employees");
  console.log();

  // ── 7. Orders ───────────────────────────────────────────────────────────────
  console.log("7. Orders");
  const statusMap: Record<string, string> = {
    enquiry: "pending",
    confirmed: "pending",
    in_progress: "in_progress",
    production: "production",
    ready: "ready",
    completed: "completed",
    delivered: "delivered",
    cancelled: "cancelled",
  };
  const orders = await fetchAll<Record<string, unknown>>(gd, "orders");
  await insert("orders", orders.map(r => ({
    id: r.id,
    business_id: B,
    order_number: r.order_number,
    customer_id: r.customer_id ?? null,
    employee_id: r.assigned_tailor_id ?? null,
    garment_type_id: null,
    order_type: r.order_type ?? null,
    status: statusMap[r.status as string] ?? "pending",
    order_date: r.order_date
      ? new Date(r.order_date as string).toISOString().split("T")[0]
      : null,
    due_date: r.due_date
      ? new Date(r.due_date as string).toISOString().split("T")[0]
      : null,
    total_cost: r.total_cost ?? 0,
    material_cost: r.material_cost ?? 0,
    labour_cost: r.labour_cost ?? 0,
    overhead_cost: r.overhead_cost ?? 0,
    deposit: r.deposit ?? 0,
    balance_due: r.balance ?? 0,
    notes: r.notes ?? null,
    style_notes: r.description ?? null,
    measurements: {},
    created_at: r.created_at,
    updated_at: r.updated_at,
  })), "orders");
  console.log();

  // ── 8. Order items ──────────────────────────────────────────────────────────
  console.log("8. Order items");
  const orderItems = await fetchAll<Record<string, unknown>>(gd, "order_items");
  await insert("order_items", orderItems.map(r => ({
    id: r.id,
    business_id: B,
    order_id: r.order_id,
    item_type: r.item_type,
    description: r.description ?? null,
    quantity: r.quantity ?? 1,
    price: r.price ?? 0,
    measurements: r.measurements ?? {},
    created_at: r.created_at,
  })), "order_items");
  console.log();

  // ── 9. Order materials ──────────────────────────────────────────────────────
  console.log("9. Order materials");
  const orderMaterials = await fetchAll<Record<string, unknown>>(gd, "order_materials");
  // Only include rows whose material_id exists in the raw materials we migrated
  const rawMaterialIds = new Set(rawMaterials.map(m => m.id));
  const filteredOrderMaterials = orderMaterials.filter(r => rawMaterialIds.has(r.material_id));
  await insert("order_materials", filteredOrderMaterials.map(r => ({
    id: r.id,
    business_id: B,
    order_id: r.order_id,
    material_id: r.material_id,
    quantity_used: r.quantity_used ?? 0,
    unit_cost: r.cost ?? 0,
    created_at: r.created_at,
  })), "order_materials");
  console.log();

  // ── 10. Inventory transactions ──────────────────────────────────────────────
  console.log("10. Inventory transactions");
  const invTx = await fetchAll<Record<string, unknown>>(gd, "inventory_transactions");
  const filteredInvTx = invTx.filter(r => rawMaterialIds.has(r.material_id));
  await insert("inventory_transactions", filteredInvTx.map(r => ({
    id: r.id,
    business_id: B,
    material_id: r.material_id,
    order_id: r.order_id ?? null,
    operation_type: r.operation_type,
    quantity_change: r.quantity_change,
    unit_cost: r.unit_cost ?? null,
    notes: r.notes ?? null,
    created_at: r.created_at,
  })), "inventory_transactions");
  console.log();

  // ── 11. Attendance ──────────────────────────────────────────────────────────
  console.log("11. Attendance");
  const attendance = await fetchAll<Record<string, unknown>>(gd, "attendance");
  await insert("attendance", attendance.map(r => ({
    id: r.id,
    business_id: B,
    employee_id: r.employee_id,
    date: r.date,
    clock_in: r.clock_in ?? null,
    clock_out: r.clock_out ?? null,
    hours_worked: r.hours_worked ?? null,
    notes: r.notes ?? null,
    created_at: r.created_at,
  })), "attendance");
  console.log();

  // ── 12. Storage ─────────────────────────────────────────────────────────────
  console.log("12. Storage buckets");
  const { data: buckets, error: bucketsError } = await gd.storage.listBuckets();
  if (bucketsError) throw new Error(`List buckets: ${bucketsError.message}`);
  console.log(`  Found buckets: ${buckets?.map(b => b.name).join(", ") || "none"}`);

  for (const bucket of buckets ?? []) {
    // Ensure bucket exists in Titunge
    await tt.storage.createBucket(bucket.name, { public: bucket.public }).catch(() => {});

    // Recursively list and copy all files
    async function migrateFolder(prefix: string) {
      const { data: items, error: listErr } = await gd.storage.from(bucket.name).list(prefix, { limit: 1000 });
      if (listErr) { console.warn(`  Warning listing ${bucket.name}/${prefix}: ${listErr.message}`); return; }
      if (!items) return;

      for (const item of items) {
        const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
        if (!item.id) {
          // It's a folder
          await migrateFolder(fullPath);
          continue;
        }
        const { data: fileData, error: dlErr } = await gd.storage.from(bucket.name).download(fullPath);
        if (dlErr || !fileData) { console.warn(`  Warning downloading ${fullPath}: ${dlErr?.message}`); continue; }
        const { error: ulErr } = await tt.storage.from(bucket.name).upload(fullPath, fileData, { upsert: true });
        if (ulErr) { console.warn(`  Warning uploading ${fullPath}: ${ulErr.message}`); continue; }
        process.stdout.write(".");
      }
    }

    console.log(`  Migrating bucket: ${bucket.name}`);
    await migrateFolder("");
    console.log(`\n  Done: ${bucket.name}`);
  }
  console.log();

  console.log("Migration complete.");
  console.log(`\nNext step: go to Titunge → create your user account → run this SQL in Supabase to link it to gloriaz-daughter:`);
  console.log(`\n  INSERT INTO business_users (business_id, user_id, role, active)`);
  console.log(`  VALUES ('${BUSINESS_ID}', '<your-user-id>', 'admin', true);`);
}

main().catch(err => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
