import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // `any` is pervasive across the pre-existing action/data-layer files
      // (mostly `(supabase.from(...) as any)` query builders) — real debt,
      // but a hard error here would block CI on unrelated pre-existing code
      // rather than catching real regressions. Cleanup is incremental,
      // starting with the money-handling files (see the codebase audit) —
      // downgraded to a warning so it stays visible without gating merges
      // on debt this rule alone can't distinguish from new mistakes.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
