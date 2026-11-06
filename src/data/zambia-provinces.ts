export const ZAMBIA_PROVINCES = [
  "Central",
  "Copperbelt",
  "Eastern",
  "Luapula",
  "Lusaka",
  "Muchinga",
  "Northern",
  "North-Western",
  "Southern",
  "Western",
] as const;

export type ZambiaProvince = (typeof ZAMBIA_PROVINCES)[number];

export function isZambiaProvince(value: string | null | undefined): value is ZambiaProvince {
  return !!value && (ZAMBIA_PROVINCES as readonly string[]).includes(value);
}
