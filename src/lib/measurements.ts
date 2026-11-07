/** True when a customer's measurements record holds at least one real value.
 *  New customers get `{}` by default, which must not count as measured. */
export function hasMeasurements(measurements: unknown): boolean {
  if (!measurements || typeof measurements !== "object") return false;
  return Object.values(measurements as Record<string, unknown>).some(
    (v) => v !== null && v !== undefined && String(v).trim() !== "" && String(v) !== "0"
  );
}
