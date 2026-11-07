import { describe, expect, it } from "vitest";
import { formatKwacha, formatKwachaCompact } from "./money";
import { hasMeasurements } from "./measurements";
import { generateOrderNumber } from "./order-number";
import { isEarnedStatus } from "./revenue";

describe("formatKwacha", () => {
  it("adds thousands separators", () => {
    expect(formatKwacha(10299)).toBe("K10,299.00");
    expect(formatKwacha(1195609.5, 0)).toBe("K1,195,610");
    expect(formatKwacha(Number.NaN)).toBe("K0.00");
  });

  it("shortens chart axis values", () => {
    expect(formatKwachaCompact(260000)).toBe("K260k");
    expect(formatKwachaCompact(1500000)).toBe("K1.5m");
    expect(formatKwachaCompact(800)).toBe("K800");
  });
});

describe("hasMeasurements", () => {
  it("ignores empty records", () => {
    expect(hasMeasurements({})).toBe(false);
    expect(hasMeasurements(null)).toBe(false);
    expect(hasMeasurements({ chest: "", waist: null })).toBe(false);
    expect(hasMeasurements({ chest: 40 })).toBe(true);
  });
});

describe("generateOrderNumber", () => {
  it("uses the business prefix", () => {
    expect(generateOrderNumber("kay", new Date(2026, 10, 7))).toMatch(/^KAY-20261107-\d{4}$/);
    expect(generateOrderNumber("", new Date(2026, 10, 7))).toMatch(/^ORD-/);
  });
});

describe("isEarnedStatus", () => {
  it("counts only completed and delivered orders", () => {
    expect(isEarnedStatus("completed")).toBe(true);
    expect(isEarnedStatus("Delivered")).toBe(true);
    expect(isEarnedStatus("ready")).toBe(false);
    expect(isEarnedStatus(null)).toBe(false);
  });
});
