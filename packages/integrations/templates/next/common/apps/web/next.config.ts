import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  reactCompiler: true,
  transpilePackages: [
    "@my-app/api",
    "@my-app/auth",
    "@my-app/db",
    "@my-app/ui",
  ],
  typedRoutes: true,
};

export default nextConfig;
