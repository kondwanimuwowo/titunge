/** Badge color classes for user roles, used across Navbar, Profile, and Users pages. */
export const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: "bg-red-50 text-red-700 border-red-200",
  manager: "bg-blue-50 text-blue-700 border-blue-200",
  employee: "bg-green-50 text-green-700 border-green-200",
};

/** Titunge teal — matches hsl(174 28% 52%) / #5fa8a0 */
export const CHART_COLORS = {
  primary: "hsl(174 28% 52%)",
  border: "hsl(30 10% 88%)",
  mutedForeground: "hsl(30 5% 48%)",
  card: "hsl(0 0% 100%)",
} as const;
