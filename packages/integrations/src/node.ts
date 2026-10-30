import { major } from "semver";

import { contribute, defineIntegration } from "@vibestart/core";

import { toolchainVersions } from "#/catalog.ts";
import { readmeTagline } from "#/vite-plus/slots.ts";

export const node = defineIntegration({
  contribute: () => [contribute(readmeTagline, "Node")],
  id: "node",
  kind: "runtime",
  name: "Node.js",
  description: `Node.js ${major(toolchainVersions.node)}`,
  homepage: "https://nodejs.org",
  auxiliary: true,
  provides: ["node-runtime"],
});
