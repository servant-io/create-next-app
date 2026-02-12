import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@servant-io/cli", "@servant-io/pre-commit-hooks"],
};

export default nextConfig;
