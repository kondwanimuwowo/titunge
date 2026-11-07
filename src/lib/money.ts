/** Kwacha amount with thousands separators, e.g. formatKwacha(10299) -> "K10,299.00". */
export function formatKwacha(amount: number, decimals = 2): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `K${value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/** Short form for chart axes: 14000 -> "K14k", 1500000 -> "K1.5m", 800 -> "K800". */
export function formatKwachaCompact(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  if (Math.abs(value) >= 1_000_000) return `K${+(value / 1_000_000).toFixed(1)}m`;
  if (Math.abs(value) >= 1_000) return `K${+(value / 1_000).toFixed(1)}k`;
  return `K${value}`;
}
