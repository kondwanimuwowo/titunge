import { describe, it, expect, vi } from "vitest";
import { insertWithOrderNumberRetry, UNIQUE_VIOLATION, generateOrderNumber } from "./marketplace-order-number";

describe("generateOrderNumber", () => {
  it("produces a TG-##### shaped number", () => {
    expect(generateOrderNumber()).toMatch(/^TG-\d{5}$/);
  });
});

describe("insertWithOrderNumberRetry", () => {
  it("succeeds immediately when there's no collision", async () => {
    const attempt = vi.fn().mockResolvedValue({ data: { id: "order-1" }, error: null });
    const result = await insertWithOrderNumberRetry(attempt);
    expect(result.data).toEqual({ id: "order-1" });
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it("retries on a unique-violation collision and succeeds on a later attempt", async () => {
    const attempt = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { code: UNIQUE_VIOLATION, message: "duplicate" } })
      .mockResolvedValueOnce({ data: null, error: { code: UNIQUE_VIOLATION, message: "duplicate" } })
      .mockResolvedValueOnce({ data: { id: "order-2" }, error: null });

    const result = await insertWithOrderNumberRetry(attempt);
    expect(result.data).toEqual({ id: "order-2" });
    expect(attempt).toHaveBeenCalledTimes(3);
    // Each retry must use a freshly generated order number, not the same one twice.
    const numbersUsed = attempt.mock.calls.map((call) => call[0]);
    expect(new Set(numbersUsed).size).toBe(3);
  });

  it("does not retry on a non-collision error — surfaces it immediately", async () => {
    const attempt = vi.fn().mockResolvedValue({ data: null, error: { code: "23503", message: "fk violation" } });
    const result = await insertWithOrderNumberRetry(attempt);
    expect(result.error?.code).toBe("23503");
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it("gives up after maxAttempts and returns the last error", async () => {
    const attempt = vi.fn().mockResolvedValue({ data: null, error: { code: UNIQUE_VIOLATION, message: "duplicate" } });
    const result = await insertWithOrderNumberRetry(attempt, 3);
    expect(attempt).toHaveBeenCalledTimes(3);
    expect(result.error?.code).toBe(UNIQUE_VIOLATION);
  });
});
