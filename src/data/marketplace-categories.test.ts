import { describe, expect, it } from "vitest";
import { categorySlugsMatching } from "./marketplace-categories";

describe("categorySlugsMatching", () => {
  it("finds chitenge by its other names", () => {
    expect(categorySlugsMatching("ankara")).toContain("chitenge");
    expect(categorySlugsMatching("wax print dress")).toContain("chitenge");
  });

  it("keeps men's and women's wear apart", () => {
    expect(categorySlugsMatching("women")).toContain("womens-wear");
    expect(categorySlugsMatching("women")).not.toContain("mens-wear");
    expect(categorySlugsMatching("mens")).toContain("mens-wear");
    expect(categorySlugsMatching("mens")).not.toContain("womens-wear");
  });

  it("matches professional uniforms", () => {
    expect(categorySlugsMatching("nurse")).toEqual(["uniforms"]);
  });

  it("ignores very short queries", () => {
    expect(categorySlugsMatching("a")).toEqual([]);
  });
});
