/** Shuffles a copy of `list` (Fisher-Yates). */
function shuffled<T>(list: readonly T[], random: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Orders products so no seller's items bunch together: sellers take turns in a
 * shuffled order, one product each per round. Within a seller, products keep
 * their incoming order when `keepOrderWithinSeller` is set (so featured items
 * lead), otherwise they're shuffled too.
 */
export function mixBySeller<T extends { businessId: string }>(
  products: readonly T[],
  { keepOrderWithinSeller = false, random = Math.random }: { keepOrderWithinSeller?: boolean; random?: () => number } = {}
): T[] {
  const bySeller = new Map<string, T[]>();
  for (const p of products) bySeller.set(p.businessId, [...(bySeller.get(p.businessId) ?? []), p]);

  const queues = shuffled([...bySeller.values()], random).map((items) =>
    keepOrderWithinSeller ? items : shuffled(items, random)
  );

  const mixed: T[] = [];
  for (let round = 0; mixed.length < products.length; round++) {
    for (const queue of queues) if (round < queue.length) mixed.push(queue[round]);
  }
  return mixed;
}
