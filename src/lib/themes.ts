export type ThemeKey =
  | "titunge-teal"
  | "gold-ochre"
  | "midnight-blue"
  | "forest-green"
  | "terracotta"
  | "deep-plum"
  | "slate-gray"
  | "rose-gold";

export interface ThemePalette {
  key: ThemeKey;
  name: string;
  primary: string;        // hsl(...)
  primaryFg: string;
  background: string;
  foreground: string;
  ring: string;
  mainAreaTint: string;
}

export const THEMES: Record<ThemeKey, ThemePalette> = {
  "titunge-teal": {
    key: "titunge-teal",
    name: "Titunge Teal",
    primary: "174 28% 52%",
    primaryFg: "0 0% 100%",
    background: "30 15% 96%",
    foreground: "200 10% 12%",
    ring: "174 28% 52%",
    mainAreaTint: "174 30% 94%",
  },
  "gold-ochre": {
    key: "gold-ochre",
    name: "Gold Ochre",
    primary: "46 70% 40%",
    primaryFg: "0 0% 100%",
    background: "40 20% 97%",
    foreground: "30 15% 12%",
    ring: "46 70% 40%",
    mainAreaTint: "46 60% 95%",
  },
  "midnight-blue": {
    key: "midnight-blue",
    name: "Midnight Blue",
    primary: "220 60% 35%",
    primaryFg: "0 0% 100%",
    background: "220 20% 97%",
    foreground: "220 25% 12%",
    ring: "220 60% 35%",
    mainAreaTint: "220 40% 94%",
  },
  "forest-green": {
    key: "forest-green",
    name: "Forest Green",
    primary: "145 40% 38%",
    primaryFg: "0 0% 100%",
    background: "120 15% 97%",
    foreground: "145 20% 12%",
    ring: "145 40% 38%",
    mainAreaTint: "145 30% 94%",
  },
  "terracotta": {
    key: "terracotta",
    name: "Terracotta",
    primary: "16 55% 48%",
    primaryFg: "0 0% 100%",
    background: "30 20% 97%",
    foreground: "16 20% 12%",
    ring: "16 55% 48%",
    mainAreaTint: "16 40% 95%",
  },
  "deep-plum": {
    key: "deep-plum",
    name: "Deep Plum",
    primary: "280 35% 40%",
    primaryFg: "0 0% 100%",
    background: "280 15% 97%",
    foreground: "280 15% 12%",
    ring: "280 35% 40%",
    mainAreaTint: "280 25% 95%",
  },
  "slate-gray": {
    key: "slate-gray",
    name: "Slate Gray",
    primary: "215 15% 42%",
    primaryFg: "0 0% 100%",
    background: "215 10% 97%",
    foreground: "215 15% 12%",
    ring: "215 15% 42%",
    mainAreaTint: "215 12% 94%",
  },
  "rose-gold": {
    key: "rose-gold",
    name: "Rose Gold",
    primary: "345 45% 55%",
    primaryFg: "0 0% 100%",
    background: "345 20% 97%",
    foreground: "345 15% 12%",
    ring: "345 45% 55%",
    mainAreaTint: "345 30% 95%",
  },
};

export const THEME_LIST = Object.values(THEMES);

export function getTheme(key: string): ThemePalette {
  return THEMES[key as ThemeKey] ?? THEMES["titunge-teal"];
}

/** Builds the inline <style> block injected into the tenant layout */
export function buildThemeVars(key: string): string {
  const t = getTheme(key);
  return `
    --primary: ${t.primary};
    --primary-foreground: ${t.primaryFg};
    --background: ${t.background};
    --foreground: ${t.foreground};
    --ring: ${t.ring};
    --main-area-tint: ${t.mainAreaTint};
  `.trim();
}
