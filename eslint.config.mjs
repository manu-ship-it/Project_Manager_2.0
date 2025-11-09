import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Ignore any test/debug files that might be in parent directories
      "../**/debug-memory/**",
      "../**/memory-test/**",
      "../**/voice-test/**",
      "../**/timeline/**",
    ],
    rules: {
      // Allow unescaped entities (quotes) in JSX to reduce build errors
      "react/no-unescaped-entities": "warn",
      // Allow 'any' type with warning instead of error
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused variables as warnings
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];

export default eslintConfig;
