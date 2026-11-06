/**
 * Seeds "Kayz Suits", a demo menswear business with six months of ERP data
 * (customers, staff, attendance, orders, payments, stock, finance) and a
 * marketplace shop using the photos from the suit-up prototype.
 *
 * Usage (Node 24 runs the TypeScript directly):
 *   node --env-file=.env.local scripts/seed-demo-business.ts --email you@example.com [--phone 0977123456] [--reset]
 *
 * --email  an existing Titunge account; it becomes the business admin.
 * --phone  the shop's contact number, shown to buyers after they pay.
 * --reset  deletes an existing kayz-suits business (and all its rows) first.
 *
 * Data is generated from a fixed seed, so every run produces the same numbers.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SLUG = "kayz-suits";
const NAME = "Kayz Suits";
const PHOTO_ROOT = path.resolve(import.meta.dirname, "../../suit-up/public");
const DEMO_PHOTO_ROOT = path.resolve(import.meta.dirname, "demo-photos");
const BUCKET = "business-assets";

// ── CLI ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const argValue = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const EMAIL = argValue("--email")?.trim().toLowerCase();
const PHONE = argValue("--phone")?.trim() ?? null;
const RESET = args.includes("--reset");
const REFRESH_PHOTOS = args.includes("--refresh-photos");

if (!EMAIL) {
  console.error("Missing --email <account email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (use --env-file=.env.local).");
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

// ── Deterministic randomness ─────────────────────────────────────────────────
let seed = 20261107;
function rand(): number {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T,>(list: readonly T[]): T => list[Math.floor(rand() * list.length)];
const chance = (p: number) => rand() < p;
const round2 = (n: number) => Math.round(n * 100) / 100;

// ── Dates ────────────────────────────────────────────────────────────────────
const TODAY = new Date();
TODAY.setHours(12, 0, 0, 0);
const START = new Date(TODAY.getFullYear(), TODAY.getMonth() - 6, 1, 12);
const DAY = 86_400_000;
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const daysAgo = (d: Date) => Math.round((TODAY.getTime() - d.getTime()) / DAY);
const at = (d: Date, hour: number, minute = 0) => {
  const x = new Date(d);
  x.setHours(hour, minute, 0, 0);
  return x;
};

// ── Catalogue (copy rewritten for Kayz Suits) ────────────────────────────────
type Cat = "Suits" | "Shirts" | "Ties" | "Shoes";
interface SeedProduct {
  name: string;
  category: Cat;
  price: number;
  description: string;
  images: string[];
  featured?: boolean;
}

// Suit photos are free-licence Unsplash images kept in scripts/demo-photos
// ("demo/" prefix); the rest come from the suit-up prototype's public folder.
const unsplash = (...ids: string[]) => ids.map((id) => `demo/unsplash-${id}.jpg`);
const shirtImgs = (n: number, count = 4) => ["a", "b", "c", "d"].slice(0, count).map((l) => `images/suits/men-shirt-${n}${l}.jpg`);

const PRODUCTS: SeedProduct[] = [
  { name: "The Lusaka", category: "Suits", price: 8999, featured: true, images: unsplash("HgyAIYvMWkw", "-eb0moHDPBI"),
    description: "Royal blue two-piece with a notch lapel and a slim, tapered trouser. Jacket and trousers." },
  { name: "The Kafue", category: "Suits", price: 6999, images: unsplash("Ci_fZ5cL9Jo"),
    description: "Navy windowpane check two-piece. Notch lapel, two buttons, slim fit." },
  { name: "The Livingstone", category: "Suits", price: 7499, featured: true, images: unsplash("G-jo31ESuRE"),
    description: "Light grey pinstripe six-button double-breasted. Peak lapels and a lean silhouette. Slim fit." },
  { name: "The Ndola", category: "Suits", price: 7999, images: unsplash("UR-aK6OytaA"),
    description: "Black double-breasted with peak lapels. Serious when it needs to be. Jacket and trousers, slim fit." },
  { name: "The Victoria", category: "Suits", price: 6999, images: unsplash("RuBXafq461A"),
    description: "Mid-grey slim blazer paired with black trousers. Smart for the office, sharp for an evening out." },
  { name: "The Zambezi", category: "Suits", price: 6499, images: unsplash("tFaLxWkeEnA"),
    description: "Grey check jacket with a tan waistcoat and charcoal trousers. A three-piece with character." },
  { name: "The Copperbelt", category: "Suits", price: 8499, images: unsplash("MYbhN8KaaEc"),
    description: "Midnight navy two-piece in a smooth weave. Notch lapel, clean lines, slim leg." },
  { name: "The Kabulonga", category: "Suits", price: 5999, images: unsplash("ikjvPfC3pbI"),
    description: "Our everyday navy business suit. Easy to wear, easy to style. Slim fit." },
  { name: "The Barotse", category: "Suits", price: 7499, images: unsplash("ClvwtweQGB8"),
    description: "Green check dinner jacket with black trousers, for weddings and evening functions." },
  { name: "The Executive", category: "Suits", price: 6499, images: unsplash("jSjhdXDZj_8"),
    description: "Charcoal three-piece that covers every occasion. Notch lapel, chest pocket and matching waistcoat." },
  { name: "The Parliament", category: "Suits", price: 8499, featured: true, images: unsplash("YGJ9vfuwyUg", "vS0Kya7E5V4"),
    description: "Black slim two-piece. Wear it with a white shirt for the office or open-collar for an evening." },
  { name: "Black Tuxedo", category: "Suits", price: 9499, images: ["a", "b", "c", "d"].map((l) => `images/suits/tux-1${l}.jpg`),
    description: "Black dinner suit with satin lapels for weddings, galas and black-tie evenings. Jacket and trousers." },
  { name: "White Dress Shirt", category: "Shirts", price: 1299, images: shirtImgs(5),
    description: "Clean white dress shirt with dark contrast buttons. Slim fit, spread collar." },
  { name: "Charcoal Dress Shirt", category: "Shirts", price: 1299, images: shirtImgs(4),
    description: "Deep charcoal in a stretch-cotton blend. Pairs best with grey and light blue suits. Slim fit." },
  { name: "Forest Green Shirt", category: "Shirts", price: 1299, images: shirtImgs(3, 3),
    description: "Rich forest green that works well under grey and charcoal suits. Slim fit, spread collar." },
  { name: "Lavender Shirt", category: "Shirts", price: 1299, images: shirtImgs(2),
    description: "Soft lavender, a fresh alternative to white or blue under navy and charcoal. Slim fit." },
  { name: "Brown Textured Shirt", category: "Shirts", price: 1299, images: shirtImgs(1),
    description: "Warm brown in a subtle textured weave. A natural match for navy and grey check suits. Regular fit." },
  { name: "Slate Blue Tie", category: "Ties", price: 799, images: ["images/suits/tie-1.jpg"],
    description: "Muted slate blue woven tie. Sits well against grey and navy. 7cm blade." },
  { name: "Navy Tie", category: "Ties", price: 799, images: ["images/suits/tie-2.jpg"],
    description: "Deep navy woven tie. Simple and always appropriate. 7cm blade." },
  { name: "Cream Tie", category: "Ties", price: 799, images: ["images/suits/tie-3.jpg"],
    description: "Warm cream tie, a clean contrast on navy and charcoal. 7cm blade." },
  { name: "Black Oxford", category: "Shoes", price: 2499, images: ["a", "b", "c", "d"].map((l) => `images/suits/shoe-1${l}.jpg`),
    description: "High-gloss black lace-up Oxford with a slim toe. Finishes any suit. EU 39 to 45." },
  { name: "Dark Brown Oxford", category: "Shoes", price: 2499, images: ["a", "b", "c", "d"].map((l) => `images/suits/shoe-2${l}.jpg`),
    description: "Matte dark brown cap-toe Oxford with contrast stitching. Best with navy, grey and charcoal. EU 39 to 45." },
];

const SIZES: Record<Cat, string[]> = {
  Suits: ["36", "38", "40", "42", "44", "46"],
  Shirts: ["S", "M", "L", "XL", "XXL"],
  Ties: ["One size"],
  Shoes: ["39", "40", "41", "42", "43", "44", "45"],
};
const MARKETPLACE_CATEGORY: Record<Cat, string> = {
  Suits: "suits",
  Shirts: "mens-wear",
  Ties: "accessories",
  Shoes: "shoes",
};
// What Kayz pays per item (import, duty, freight), as a share of the shelf price.
const COST_SHARE: Record<Cat, number> = { Suits: 0.52, Shirts: 0.45, Ties: 0.35, Shoes: 0.5 };

// ── People ───────────────────────────────────────────────────────────────────
const FIRST = ["Mwila", "Chanda", "Bwalya", "Mutale", "Kondwani", "Thandiwe", "Lubinda", "Mulenga", "Chilufya", "Musonda",
  "Nchimunya", "Kabwe", "Mapalo", "Chipo", "Sipho", "Luyando", "Kasonde", "Mumba", "Temwani", "Kalenga", "Natasha",
  "Joseph", "Daniel", "Brian", "Emmanuel", "Patrick", "Collins", "Richard", "Moses", "Victor", "Francis", "Kelvin"];
const LAST = ["Banda", "Phiri", "Mwale", "Tembo", "Zulu", "Mulenga", "Chileshe", "Lungu", "Sakala", "Mumba", "Ngoma",
  "Daka", "Kunda", "Simukonda", "Hamweemba", "Mwanza", "Chirwa", "Bwalya", "Kapembwa", "Nyirenda"];
const AREAS = ["Kabulonga", "Woodlands", "Rhodes Park", "Roma", "Chelston", "Ibex Hill", "Olympia", "Longacres",
  "Avondale", "Northmead", "Kalundu", "Chalala", "Makeni", "Meanwood"];
const phone = () => `09${pick(["5", "6", "7"])}${int(1000000, 9999999)}`;

const EMPLOYEES = [
  { name: "Mwila Banda", role: "Head Tailor", rate: 85, tailor: true, hired: "2021-03-01" },
  { name: "Chanda Mulenga", role: "Tailor", rate: 60, tailor: true, hired: "2022-07-11" },
  { name: "Grace Zulu", role: "Store Manager", rate: 75, tailor: false, hired: "2020-02-03" },
  { name: "Natasha Phiri", role: "Sales Associate", rate: 45, tailor: false, hired: "2023-05-15" },
  { name: "Joseph Tembo", role: "Sales Associate", rate: 45, tailor: false, hired: "2024-01-08" },
];

const GARMENT_TYPES = [
  { name: "Made-to-measure suit", labour: 1400, hours: 18, complexity: "complex", price: [7500, 12500] as const },
  { name: "Wedding suit", labour: 1800, hours: 22, complexity: "complex", price: [9500, 15000] as const },
  { name: "Trouser alteration", labour: 120, hours: 1, complexity: "simple", price: [150, 250] as const },
  { name: "Jacket alteration", labour: 250, hours: 2, complexity: "standard", price: [300, 550] as const },
];

const MATERIALS = [
  { name: "Wool blend suiting", unit: "metres", stock: 46, min: 20, cost: 280, supplier: "Lusaka Textile Traders" },
  { name: "Viscose lining", unit: "metres", stock: 14, min: 15, cost: 65, supplier: "Lusaka Textile Traders" },
  { name: "Fusible interfacing", unit: "metres", stock: 30, min: 10, cost: 40, supplier: "Lusaka Textile Traders" },
  { name: "Horn buttons", unit: "pieces", stock: 180, min: 60, cost: 6, supplier: "Kamwala Haberdashery" },
  { name: "Polyester thread", unit: "spools", stock: 9, min: 12, cost: 25, supplier: "Kamwala Haberdashery" },
  { name: "Garment bags", unit: "pieces", stock: 64, min: 30, cost: 18, supplier: "Copperbelt Packaging" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
async function must<T>(label: string, promise: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<NonNullable<T>> {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  if (data == null) throw new Error(`${label}: no data returned`);
  return data;
}

async function run(label: string, promise: PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  const { error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
}

async function insertChunks(table: string, rows: Record<string, unknown>[], label = table) {
  for (let i = 0; i < rows.length; i += 500) {
    await run(`${label} insert`, db.from(table).insert(rows.slice(i, i + 500)));
  }
  console.log(`  ${label}: ${rows.length}`);
}

async function uploadPhoto(businessId: string, rel: string, dest: string): Promise<string> {
  const body = await readFile(rel.startsWith("demo/") ? path.join(DEMO_PHOTO_ROOT, rel.slice(5)) : path.join(PHOTO_ROOT, rel));
  const key = `${businessId}/${dest}`;
  await must(`upload ${rel}`, db.storage.from(BUCKET).upload(key, body, { upsert: true, contentType: "image/jpeg" }));
  return db.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Seeding ${NAME} into ${url}\n`);

  // Account
  const user = await findUser(EMAIL!);
  if (!user) throw new Error(`No Titunge account for ${EMAIL}. Sign up first, then re-run.`);

  // Existing business
  const { data: existing } = await db.from("businesses").select("id").eq("slug", SLUG).maybeSingle();
  if (existing && REFRESH_PHOTOS) {
    await refreshPhotos(existing.id);
    return;
  }
  if (existing) {
    if (!RESET) throw new Error(`${SLUG} already exists. Re-run with --reset to delete it and seed again.`);
    const files = await listAll(existing.id);
    if (files.length) await run("remove photos", db.storage.from(BUCKET).remove(files));
    await run("delete business", db.from("businesses").delete().eq("id", existing.id));
    console.log(`Deleted existing ${SLUG}\n`);
  }

  // Business + membership
  const business = await must("business", db.from("businesses").insert({
    name: NAME, slug: SLUG, order_prefix: "KAY", currency: "ZMW", timezone: "Africa/Lusaka",
    theme_key: "titunge-teal", plan: "free", focus: "full_erp", sizing_standard: "uk",
    created_at: addDays(START, -20).toISOString(),
  }).select("id").single());
  const B = business.id as string;
  console.log(`Business ${B}`);

  await run("profile", db.from("user_profiles").upsert({ id: user.id, email: user.email }, { onConflict: "id", ignoreDuplicates: true }));
  await run("membership", db.from("business_users").insert({ business_id: B, user_id: user.id, role: "admin", active: true }));

  await run("financial settings", db.from("financial_settings").insert({
    business_id: B, custom_hourly_rate: 70, default_profit_margin: 40, expected_monthly_orders: 30, tax_rate: 0, default_labour_hours: 2,
  }));

  // Products + photos
  console.log("\nUploading photos");
  const banner = await uploadPhoto(B, "demo/unsplash-Z164NLbealo.jpg", "storefront-banner.jpg");
  await run("storefront", db.from("business_storefront").insert({
    business_id: B,
    bio: "Formal menswear in Lusaka: ready-to-wear suits, shirts, ties and shoes, plus made-to-measure suits and alterations by our in-house tailors.",
    banner_url: banner,
    location: "Northmead",
    province: "Lusaka",
    founded_year: 2020,
    contact_phone: PHONE,
    delivery_policy: "Collect from our Northmead shop, or we arrange delivery within Lusaka once you've paid. Outside Lusaka we send by bus courier.",
    returns_policy: "Exchanges within 7 days on unworn items with tags. Altered or made-to-measure pieces can't be returned.",
    custom_orders_policy: "Made-to-measure suits take 2 to 3 weeks and need a fitting. Free hemming on any suit bought from us.",
  }));

  const productRows: { id: string; seed: SeedProduct; stock: number }[] = [];
  for (const p of PRODUCTS) {
    const stock = p.category === "Suits" ? int(2, 9) : int(6, 24);
    const created = addDays(START, -int(5, 15));
    const row = await must(`product ${p.name}`, db.from("products").insert({
      business_id: B, name: p.name, description: p.description, price: p.price, category: p.category,
      product_type: "finished_good", sizes: SIZES[p.category], images: [], stock_quantity: stock, active: true,
      created_at: created.toISOString(), updated_at: created.toISOString(),
    }).select("id").single());
    const urls: string[] = [];
    for (const [i, rel] of p.images.entries()) {
      urls.push(await uploadPhoto(B, rel, `products/${row.id}/${i + 1}-${path.basename(rel)}`));
    }
    await run("product images", db.from("products").update({ images: urls }).eq("id", row.id));
    await run("storefront extra", db.from("product_storefront_extra").insert({
      product_id: row.id, category_slug: MARKETPLACE_CATEGORY[p.category], featured: !!p.featured,
      shipping_lead_time: "Ready to collect in 1 to 2 days",
      care_instructions: p.category === "Suits" ? "Dry clean only. Hang on a shaped hanger." : p.category === "Shoes" ? "Wipe clean and polish regularly." : "Wash cold, iron on medium.",
    }));
    productRows.push({ id: row.id, seed: p, stock });
    process.stdout.write(".");
  }
  console.log(`\n  products: ${productRows.length}`);

  // Staff + attendance
  console.log("\nStaff and attendance");
  const employees = await must("employees", db.from("employees").insert(EMPLOYEES.map((e, i) => ({
    business_id: B, name: e.name, role: e.role, hourly_rate: e.rate, hire_date: e.hired, active: true,
    phone: phone(), email: `${e.name.split(" ")[0].toLowerCase()}@kayzsuits.example`,
    created_at: addDays(START, -30 + i).toISOString(),
  }))).select("id, name"));
  const empId = (name: string) => employees.find((e: { name: string }) => e.name === name)!.id as string;
  const tailors = EMPLOYEES.filter((e) => e.tailor).map((e) => empId(e.name));
  const sales = EMPLOYEES.filter((e) => !e.tailor).map((e) => empId(e.name));

  const attendance: Record<string, unknown>[] = [];
  for (let d = 45; d >= 0; d--) {
    const day = addDays(TODAY, -d);
    if (day.getDay() === 0) continue; // closed Sundays
    for (const e of EMPLOYEES) {
      if (d > 0 && chance(0.06)) continue;
      const inAt = at(day, 8, int(0, 25));
      const saturday = day.getDay() === 6;
      const outAt = at(day, saturday ? 14 : 17, int(0, 40));
      const isToday = d === 0;
      attendance.push({
        business_id: B, employee_id: empId(e.name), date: ymd(day),
        clock_in: localTs(inAt),
        clock_out: isToday ? null : localTs(outAt),
        hours_worked: isToday ? null : round2((outAt.getTime() - inAt.getTime()) / 3_600_000),
      });
    }
  }
  await insertChunks("attendance", attendance);

  // Garment types + materials
  const garmentTypes = await must("garment types", db.from("garment_types").insert(GARMENT_TYPES.map((g) => ({
    business_id: B, name: g.name, base_labour_cost: g.labour, estimated_hours: g.hours, complexity: g.complexity, active: true,
  }))).select("id, name"));
  const gtId = (name: string) => garmentTypes.find((g: { name: string }) => g.name === name)!.id as string;

  const materials = await must("materials", db.from("materials").insert(MATERIALS.map((m) => ({
    business_id: B, name: m.name, unit: m.unit, stock_quantity: m.stock, min_stock_level: m.min, unit_cost: m.cost,
    supplier: m.supplier, last_restocked: addDays(TODAY, -int(6, 30)).toISOString(),
  }))).select("id, name, unit_cost"));
  const mat = (name: string) => materials.find((m: { name: string }) => m.name === name)!;
  await insertChunks("inventory_transactions", materials.flatMap((m: { id: string; unit_cost: number }) => [0, 1, 2].map((k) => ({
    business_id: B, material_id: m.id, operation_type: "restock", quantity_change: int(10, 40), unit_cost: m.unit_cost,
    notes: "Supplier delivery", created_at: addDays(START, k * 60 + int(0, 20)).toISOString(),
  }))), "material restocks");

  // Customers
  console.log("\nCustomers and orders");
  const names = new Set<string>();
  while (names.size < 52) names.add(`${pick(FIRST)} ${pick(LAST)}`);
  const customers = await must("customers", db.from("customers").insert([...names].map((name, i) => {
    const created = addDays(START, Math.floor((i / 52) * daysAgo(START)) - 3);
    return {
      business_id: B, name, phone: phone(),
      email: chance(0.5) ? `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com` : null,
      address: `${pick(AREAS)}, Lusaka`,
      measurements: chance(0.6) ? { chest: int(36, 46), waist: int(30, 40), sleeve: int(23, 27), inseam: int(29, 34) } : {},
      created_at: created.toISOString(), updated_at: created.toISOString(),
    };
  })).select("id, name, created_at"));

  // Orders: growing from ~14 a month to ~32 a month.
  const orders: Record<string, unknown>[] = [];
  const items: Record<string, unknown>[] = [];
  const orderMaterials: Record<string, unknown>[] = [];
  const payments: Record<string, unknown>[] = [];
  const sold = new Map<string, number>();
  const totalDays = daysAgo(START);
  let seq = 1;

  for (let d = totalDays; d >= 0; d--) {
    const day = addDays(TODAY, -d);
    if (day.getDay() === 0) continue;
    const progress = 1 - d / totalDays;
    const expected = (14 + progress * 18) / 26 * (day.getDay() === 6 ? 1.6 : 1);
    const count = Math.floor(expected) + (chance(expected % 1) ? 1 : 0);

    for (let n = 0; n < count; n++) {
      const eligible = customers.filter((c: { created_at: string }) => new Date(c.created_at) <= day);
      const customer = pick(eligible.length ? eligible : customers);
      const custom = chance(0.28);
      const orderId = crypto.randomUUID();
      const lines: { total: number; material: number; labour: number }[] = [];
      let tailor: string | null = null;
      let garmentTypeId: string | null = null;
      let productId: string | null = null;
      let description: string;

      if (custom) {
        const gt = pick([GARMENT_TYPES[0], GARMENT_TYPES[0], GARMENT_TYPES[1], GARMENT_TYPES[2], GARMENT_TYPES[2], GARMENT_TYPES[3]]);
        const price = Math.round(int(gt.price[0], gt.price[1]) / 50) * 50;
        const isSuit = gt.labour > 1000;
        const fabric = isSuit ? round2(3 + rand() * 0.8) : 0;
        const used = isSuit
          ? [
              { m: mat("Wool blend suiting"), q: fabric },
              { m: mat("Viscose lining"), q: 2 },
              { m: mat("Fusible interfacing"), q: 1 },
              { m: mat("Horn buttons"), q: 10 },
              { m: mat("Polyester thread"), q: 1 },
            ]
          : [{ m: mat("Polyester thread"), q: 0.25 }];
        const materialCost = round2(used.reduce((s, u) => s + u.q * Number(u.m.unit_cost), 0));
        const itemId = crypto.randomUUID();
        items.push({
          id: itemId, business_id: B, order_id: orderId, item_type: "custom", garment_type_id: gtId(gt.name),
          description: gt.name, quantity: 1, unit_price: price, material_cost: materialCost, labour_cost: gt.labour,
          measurements: { chest: int(36, 46), waist: int(30, 40), sleeve: int(23, 27) },
        });
        for (const u of used) orderMaterials.push({
          business_id: B, order_id: orderId, order_item_id: itemId, material_id: u.m.id, quantity_used: u.q, unit_cost: u.m.unit_cost,
        });
        lines.push({ total: price, material: materialCost, labour: gt.labour });
        tailor = pick(tailors);
        garmentTypeId = gtId(gt.name);
        description = gt.name;
      } else {
        const suit = pick(productRows.filter((p) => p.seed.category === "Suits"));
        const basket = [suit];
        if (chance(0.55)) basket.push(pick(productRows.filter((p) => p.seed.category === "Shirts")));
        if (chance(0.4)) basket.push(pick(productRows.filter((p) => p.seed.category === "Ties")));
        if (chance(0.25)) basket.push(pick(productRows.filter((p) => p.seed.category === "Shoes")));
        if (basket.length > 1 && chance(0.15)) basket.splice(0, 1); // accessories-only visit
        for (const p of basket) {
          const qty = p.seed.category === "Suits" ? 1 : int(1, 2);
          const cost = round2(p.seed.price * COST_SHARE[p.seed.category] * qty);
          items.push({
            id: crypto.randomUUID(), business_id: B, order_id: orderId, item_type: "ready_made", product_id: p.id,
            description: p.seed.name, quantity: qty, unit_price: p.seed.price, material_cost: cost, labour_cost: 0,
          });
          lines.push({ total: p.seed.price * qty, material: cost, labour: 0 });
          sold.set(p.id, (sold.get(p.id) ?? 0) + qty);
        }
        productId = basket[0].id;
        description = basket.map((p) => p.seed.name).join(", ");
        tailor = pick(sales);
      }

      const total = round2(lines.reduce((s, l) => s + l.total, 0));
      const age = d;
      let status: string;
      if (chance(0.035)) status = "cancelled";
      else if (!custom) status = age <= 2 && chance(0.3) ? "ready" : "completed";
      else if (age > 24) status = chance(0.6) ? "delivered" : "completed";
      else if (age > 12) status = pick(["fitting", "ready", "completed", "delivered"]);
      else if (age > 4) status = pick(["in_progress", "production", "fitting"]);
      else status = pick(["enquiry", "measurements", "in_progress"]);

      const done = status === "completed" || status === "delivered";
      const due = custom ? addDays(day, int(14, 21)) : day;
      const method = () => pick(["Mobile Money", "Mobile Money", "Cash", "Bank Transfer"]);
      const deposit = status === "cancelled" || status === "enquiry" ? 0 : custom ? Math.round(total * 0.5) : total;
      let paid = deposit;
      if (deposit > 0) {
        payments.push({
          business_id: B, order_id: orderId, payment_date: ymd(day), amount: deposit, payment_method: method(),
          source: "deposit", notes: custom ? "Deposit" : "Paid in full",
        });
      }
      if (custom && done && total > deposit) {
        const collected = addDays(due, int(-2, 3));
        payments.push({
          business_id: B, order_id: orderId, payment_date: ymd(collected > TODAY ? TODAY : collected),
          amount: total - deposit, payment_method: method(), source: "balance", notes: "Balance on collection",
        });
        paid = total;
      }

      const created = at(day, int(9, 17), int(0, 59));
      orders.push({
        id: orderId, business_id: B,
        order_number: `KAY-${ymd(day).replaceAll("-", "")}-${String(seq++).padStart(4, "0")}`,
        customer_id: customer.id, assigned_tailor_id: tailor, garment_type_id: garmentTypeId, product_id: productId,
        order_type: custom ? "custom" : "product", status, order_date: ymd(day), due_date: ymd(due),
        total_cost: total,
        material_cost: round2(lines.reduce((s, l) => s + l.material, 0)),
        labour_cost: round2(lines.reduce((s, l) => s + l.labour, 0)),
        overhead_cost: 0,
        deposit,
        balance_due: status === "cancelled" ? 0 : round2(total - paid),
        description,
        cancellation_reason: status === "cancelled" ? "Customer changed their mind" : null,
        cancelled_at: status === "cancelled" ? addDays(day, 1).toISOString() : null,
        created_at: created.toISOString(), updated_at: created.toISOString(),
      });
    }
  }

  await insertChunks("orders", orders);
  await insertChunks("order_items", items);
  await insertChunks("order_materials", orderMaterials);
  await insertChunks("payments", payments);

  // Finance: monthly overheads and running expenses
  console.log("\nFinance");
  const overheads: Record<string, unknown>[] = [];
  const expenses: Record<string, unknown>[] = [];
  for (let m = 0; m <= 6; m++) {
    const month = new Date(START.getFullYear(), START.getMonth() + m, 1, 12);
    if (month > TODAY) break;
    const first = ymd(month);
    overheads.push(
      { business_id: B, month: first, category: "Rent", description: "Northmead shop rent", amount: 15000 },
      { business_id: B, month: first, category: "Salaries", description: "Staff salaries", amount: 31500 },
      { business_id: B, month: first, category: "Utilities", description: "ZESCO and water", amount: int(1600, 2300) },
      { business_id: B, month: first, category: "Internet", description: "Fibre internet", amount: 950 },
    );
    const inMonth = (dayOfMonth: number) => {
      const d = new Date(month.getFullYear(), month.getMonth(), dayOfMonth, 12);
      return d > TODAY ? null : ymd(d);
    };
    const add = (dayOfMonth: number, category: string, description: string, amount: number, method: string) => {
      const date = inMonth(dayOfMonth);
      if (date) expenses.push({ business_id: B, expense_date: date, category, description, amount, payment_method: method });
    };
    add(4, "Marketing", "Facebook and Instagram ads", int(1800, 3500), "Mobile Money");
    add(9, "Transport", "Stock clearing and freight from Dar es Salaam", int(4500, 7500), "Bank Transfer");
    add(15, "Other", "Hangers, tags and carrier bags", int(600, 1200), "Cash");
    add(21, "Transport", "Customer deliveries", int(500, 1100), "Cash");
    if (m % 2 === 1) add(26, "Materials", "Tailoring supplies top-up", int(1200, 2500), "Cash");
  }
  await insertChunks("overhead_costs", overheads);
  await insertChunks("expenses", expenses);

  // Stock ledger: what came in = what's on the shelf now + what sold.
  await insertChunks("inventory_transactions", productRows.map((p) => ({
    business_id: B, product_id: p.id, operation_type: "restock", quantity_change: p.stock + (sold.get(p.id) ?? 0),
    notes: "Opening stock and shipments", created_at: addDays(START, -2).toISOString(),
  })), "product stock in");

  // Inquiries, quotations and notifications for the demo
  console.log("\nInquiries, documents, notifications");
  const recentCustomers = customers.slice(-8);
  await insertChunks("customer_inquiries", [0, 1, 2, 3, 4].map((i) => {
    const product = productRows[[0, 2, 10, 11, 8][i]];
    const c = recentCustomers[i];
    const created = addDays(TODAY, -i);
    return {
      business_id: B, product_id: product.id, customer_name: c.name, customer_phone: phone(),
      preferred_size: pick(["38", "40", "42"]), custom_measurements_needed: i % 2 === 0,
      special_requests: ["Need it for a wedding on the 21st", "Can I get the trousers hemmed?", "Do you have this in a 44?", "Looking for 3 matching suits for groomsmen", "Is the ivory available in stock?"][i],
      contact_method: "whatsapp", status: i < 3 ? "new" : "contacted", created_at: created.toISOString(), updated_at: created.toISOString(),
      contacted_at: i < 3 ? null : created.toISOString(),
    };
  }));

  const quoteItems = [{ description: "The Executive three-piece suit", quantity: 12, unit_price: 6000 }, { description: "White Dress Shirt", quantity: 24, unit_price: 1100 }, { description: "Navy Tie", quantity: 12, unit_price: 650 }];
  const invoiceItems = [{ description: "Wedding suit, made to measure", quantity: 4, unit_price: 9800 }, { description: "Cream Tie", quantity: 4, unit_price: 799 }];
  const docTotal = (rows: { quantity: number; unit_price: number }[]) => rows.reduce((s, r) => s + r.quantity * r.unit_price, 0);
  const docs = await must("documents", db.from("documents").insert([
    {
      business_id: B, type: "quotation", document_number: `QT-${ymd(addDays(TODAY, -3)).replaceAll("-", "")}-0001`,
      recipient_name: "Chiwala Logistics Ltd", recipient_email: "procurement@chiwala.example", status: "sent",
      issue_date: ymd(addDays(TODAY, -3)), valid_until: ymd(addDays(TODAY, 27)),
      description: "Staff uniform suits, 12 managers", subtotal: docTotal(quoteItems), total: docTotal(quoteItems), created_by: user.id,
      customer_id: null, due_date: null, amount_paid: 0,
    },
    {
      business_id: B, type: "invoice", document_number: `INV-${ymd(addDays(TODAY, -10)).replaceAll("-", "")}-0001`,
      customer_id: recentCustomers[5].id, recipient_name: recentCustomers[5].name, status: "partially_paid",
      issue_date: ymd(addDays(TODAY, -10)), due_date: ymd(addDays(TODAY, 11)),
      description: "Groom and groomsmen suits", subtotal: docTotal(invoiceItems), total: docTotal(invoiceItems),
      amount_paid: 20000, created_by: user.id, recipient_email: null, valid_until: null,
    },
  ]).select("id, type"));
  const quoteId = docs.find((d: { type: string }) => d.type === "quotation")!.id;
  const invoiceId = docs.find((d: { type: string }) => d.type === "invoice")!.id;
  await insertChunks("document_items", [
    ...quoteItems.map((r) => ({ business_id: B, document_id: quoteId, ...r })),
    ...invoiceItems.map((r) => ({ business_id: B, document_id: invoiceId, ...r })),
  ]);
  await insertChunks("document_payments", [{
    business_id: B, document_id: invoiceId, amount: 20000, method: "Bank Transfer", notes: "Deposit",
    paid_at: addDays(TODAY, -9).toISOString(),
  }]);

  await insertChunks("notifications", [
    { business_id: B, type: "low_stock", title: "Low stock: Viscose lining", message: "14 metres left, below your minimum of 15.", link: "/inventory", read: false, created_at: addDays(TODAY, -1).toISOString() },
    { business_id: B, type: "low_stock", title: "Low stock: Polyester thread", message: "9 spools left, below your minimum of 12.", link: "/inventory", read: false, created_at: addDays(TODAY, -2).toISOString() },
    { business_id: B, type: "order_update", title: "New enquiry", message: `${recentCustomers[0].name} asked about The Lusaka.`, link: "/inquiries", read: false, created_at: TODAY.toISOString() },
  ]);

  // Summary
  const earned = orders.filter((o) => o.status === "completed" || o.status === "delivered");
  const revenue = earned.reduce((s, o) => s + Number(o.total_cost), 0);
  console.log(`\nDone. ${orders.length} orders, ${earned.length} completed, revenue K${Math.round(revenue).toLocaleString()}`);
  console.log(`Workspace: https://${SLUG}.titunge.com   Shop: https://titunge.com/shop/${SLUG}`);
}

/** Re-uploads every product's photos and description, plus the banner, on an
 *  existing business without touching its orders or settings. */
async function refreshPhotos(businessId: string) {
  console.log("Refreshing photos and descriptions");
  const products = await must("products", db.from("products").select("id, name").eq("business_id", businessId));
  const stamp = Date.now();
  for (const p of PRODUCTS) {
    const row = products.find((r: { name: string }) => r.name === p.name);
    if (!row) { console.log(`  skipped ${p.name} (not found)`); continue; }
    const old = await listAll(`${businessId}/products/${row.id}`);
    const urls: string[] = [];
    for (const [i, rel] of p.images.entries()) {
      urls.push(await uploadPhoto(businessId, rel, `products/${row.id}/${stamp}-${i + 1}-${path.basename(rel)}`));
    }
    await run("product", db.from("products").update({ images: urls, description: p.description, updated_at: new Date().toISOString() }).eq("id", row.id));
    if (old.length) await run("remove old photos", db.storage.from(BUCKET).remove(old));
    process.stdout.write(".");
  }
  const banner = await uploadPhoto(businessId, "demo/unsplash-Z164NLbealo.jpg", `storefront-banner-${stamp}.jpg`);
  await run("banner", db.from("business_storefront").update({ banner_url: banner }).eq("business_id", businessId));
  const oldBanners = (await db.storage.from(BUCKET).list(businessId)).data
    ?.filter((f) => f.name.startsWith("storefront-banner") && f.name !== `storefront-banner-${stamp}.jpg`)
    .map((f) => `${businessId}/${f.name}`) ?? [];
  if (oldBanners.length) await run("remove old banner", db.storage.from(BUCKET).remove(oldBanners));
  console.log(`\nDone. ${PRODUCTS.length} products and the banner refreshed.`);
}

function localTs(d: Date): string {
  return `${ymd(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
}

async function findUser(email: string): Promise<{ id: string; email: string } | null> {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`list users: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return { id: match.id, email: match.email! };
    if (data.users.length < 200) return null;
  }
  return null;
}

async function listAll(prefix: string): Promise<string[]> {
  const out: string[] = [];
  const { data } = await db.storage.from(BUCKET).list(prefix, { limit: 1000 });
  for (const entry of data ?? []) {
    const full = `${prefix}/${entry.name}`;
    if (entry.id) out.push(full);
    else out.push(...(await listAll(full)));
  }
  return out;
}

main().catch((err) => {
  console.error(`\nFailed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
