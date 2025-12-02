import { nextJsConfig } from "./ema/eslint-config/next.js";

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    rules: {
      // Keep async functions meaningful and enforce native <Image /> usage.
      "@typescript-eslint/require-await": "error",
      "@next/next/no-img-element": "error",
    },
  },
  {
    ignores: ["coverage/**", "out/**", "build/**"],
  },
];
