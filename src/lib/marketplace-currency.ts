export function formatZmw(amount: number): string {
  return `K${Math.round(amount).toLocaleString()}`;
}
