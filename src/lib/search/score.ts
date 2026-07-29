function norm(s: string | null | undefined): string {
  return (s || "").toString().trim().toLowerCase();
}

/** Score a single field against the query: exact > prefix > word-boundary > substring. */
export function fieldScore(value: string | null | undefined, query: string): number {
  const v = norm(value);
  const q = norm(query);
  if (!v || !q) return 0;
  if (v === q) return 100;
  if (v.startsWith(q)) return 85;
  if (v.split(/\s+/).some((w) => w.startsWith(q))) return 70;
  if (v.includes(q)) return 55;
  return 0;
}

/** Best-weighted score across multiple fields, e.g. [[name, 1], [email, 0.6]]. */
export function weightedScore(fields: [string | null | undefined, number][], query: string): number {
  let max = 0;
  for (const [value, weight] of fields) {
    const s = fieldScore(value, query) * weight;
    if (s > max) max = s;
  }
  return max;
}

/** Small recency boost (0-8) for records updated/created within the last 14 days. */
export function recencyBonus(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const date = new Date(dateStr).getTime();
  if (Number.isNaN(date)) return 0;
  const days = (Date.now() - date) / (1000 * 60 * 60 * 24);
  if (days < 0) return 0;
  if (days >= 14) return 0;
  return Math.round((1 - days / 14) * 8);
}

/** Strip characters that would break a PostgREST `.or()` filter string. */
export function sanitizeForFilter(q: string): string {
  return q.replace(/[,()%]/g, "").trim();
}
