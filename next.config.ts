import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@servant-io/cli", "@servant-io/pre-commit-hooks"],
  outputFileTracingIncludes: {
    "/servant-pxt": [
      "./node_modules/@servant-io/agents/src/agents.json",
      "./node_modules/@servant-io/skills/src/skills.json",
      "./node_modules/@servant-io/product-os/src/skills.json",
      "./node_modules/@servant-io/actions/docs-up-to-date/action.yml",
    ],
  },
};

export default nextConfig;
