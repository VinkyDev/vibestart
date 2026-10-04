import { contribute, defineIntegration } from "@vibestart/core";

import { readmeTagline } from "#/vite-plus/slots.ts";

export const node = defineIntegration({
  contribute: () => [contribute(readmeTagline, "Node")],
  id: "node",
  kind: "runtime",
  name: "Node.js",
  description: "Node.js 24",
  homepage: "https://nodejs.org",
  auxiliary: true,
  provides: ["node-runtime"],
});
