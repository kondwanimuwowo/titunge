import { getCloudflareContext } from "@opennextjs/cloudflare";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Product images live in R2 under `{business_id}/{product_id}/{timestamp}-{name}`.
 * Reads are public (the marketplace and catalog are unauthenticated), so tenant
 * isolation is enforced on every write and delete: a business can only touch
 * keys under its own `business_id` prefix.
 */
export const PRODUCT_IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";

export type DeleteOutcome = "deleted" | "not-in-r2" | "forbidden";

function readPublicBaseUrl(env: CloudflareEnv): string {
  const base = env.R2_PUBLIC_BASE_URL ?? process.env.R2_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error(
      "R2_PUBLIC_BASE_URL is not set. Point it at the product-images bucket's public custom domain."
    );
  }
  return base.replace(/\/+$/, "");
}

async function getBucketContext(): Promise<{ bucket: R2Bucket; baseUrl: string }> {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = env.PRODUCT_IMAGES;
  if (!bucket) {
    throw new Error(
      "R2 binding PRODUCT_IMAGES is unavailable. Check wrangler.toml, then run `npm run cf:typegen`."
    );
  }
  return { bucket, baseUrl: readPublicBaseUrl(env) };
}

export function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/_{2,}/g, "_");
  return cleaned.slice(-100) || "image";
}

export function buildProductImageKey(
  businessId: string,
  productId: string,
  fileName: string
): string {
  if (!UUID_RE.test(businessId)) throw new Error("Invalid business id");
  if (!UUID_RE.test(productId)) throw new Error("Invalid product id");
  return `${businessId}/${productId}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

export function keyBelongsToBusiness(key: string, businessId: string): boolean {
  return key.startsWith(`${businessId}/`);
}

/** Returns the R2 object key for a URL served from our bucket, or null if it isn't one. */
export function productImageKeyFromUrl(url: string, baseUrl: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== new URL(baseUrl).origin) return null;
    const key = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
    return key || null;
  } catch {
    return null;
  }
}

export async function putProductImage(params: {
  businessId: string;
  productId: string;
  fileName: string;
  body: ArrayBuffer;
  contentType: string;
}): Promise<{ key: string; url: string }> {
  const { bucket, baseUrl } = await getBucketContext();
  const key = buildProductImageKey(params.businessId, params.productId, params.fileName);

  await bucket.put(key, params.body, {
    httpMetadata: {
      contentType: params.contentType,
      cacheControl: PRODUCT_IMAGE_CACHE_CONTROL,
    },
    customMetadata: {
      businessId: params.businessId,
      productId: params.productId,
    },
  });

  return { key, url: `${baseUrl}/${key}` };
}

export async function deleteProductImageByUrl(
  url: string,
  businessId: string
): Promise<DeleteOutcome> {
  // Work out whether this is even ours before reaching for the binding, so a
  // missing or misconfigured R2 can't take the legacy Supabase path down too.
  const { env } = await getCloudflareContext({ async: true });
  const key = productImageKeyFromUrl(url, readPublicBaseUrl(env));
  if (!key) return "not-in-r2";
  if (!keyBelongsToBusiness(key, businessId)) return "forbidden";

  const { bucket } = await getBucketContext();
  await bucket.delete(key);
  return "deleted";
}

/**
 * Removes every object a product owns. Called when a product is permanently
 * deleted — otherwise its images stay in the bucket forever, billed and
 * unreachable. Scoped to the business prefix, so it can only ever clear the
 * caller's own objects.
 */
export async function deleteProductImagePrefix(
  businessId: string,
  productId: string
): Promise<number> {
  if (!UUID_RE.test(businessId) || !UUID_RE.test(productId)) return 0;

  const { bucket } = await getBucketContext();
  const prefix = `${businessId}/${productId}/`;
  let removed = 0;
  let cursor: string | undefined;

  do {
    const listed = await bucket.list({ prefix, cursor });
    const keys = listed.objects.map((o) => o.key);
    if (keys.length > 0) {
      await bucket.delete(keys);
      removed += keys.length;
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  return removed;
}
