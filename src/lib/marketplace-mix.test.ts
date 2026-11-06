import { describe, expect, it } from "vitest";
import { mixBySeller } from "./marketplace-mix";

const products = [
  ...["a1", "a2", "a3", "a4"].map((id) => ({ id, businessId: "A" })),
  ...["b1", "b2"].map((id) => ({ id, businessId: "B" })),
  ...["c1"].map((id) => ({ id, businessId: "C" })),
];

describe("mixBySeller", () => {
  it("keeps every product exactly once", () => {
    const mixed = mixBySeller(products);
    expect(mixed.map((p) => p.id).sort()).toEqual(products.map((p) => p.id).sort());
  });

  it("never repeats a seller until every seller with items left has had a turn", () => {
    for (let run = 0; run < 20; run++) {
      const sellers = mixBySeller(products).map((p) => p.businessId);
      expect(new Set(sellers.slice(0, 3)).size).toBe(3);
      expect(new Set(sellers.slice(3, 5)).size).toBe(2);
    }
  });

  it("keeps a seller's own order when asked", () => {
    const mixed = mixBySeller(products, { keepOrderWithinSeller: true });
    expect(mixed.filter((p) => p.businessId === "A").map((p) => p.id)).toEqual(["a1", "a2", "a3", "a4"]);
  });
});
