import { contribute, defineIntegration, packageJson } from "@vibestart/core";

import { toolchainVersions } from "#/catalog.ts";
import { readmeCommandNotes, readmeTagline } from "#/vite-plus/slots.ts";

/** Hono runs on Bun; Node remains available to the web framework and Vite+ tools. */
export const bun = defineIntegration({
  contribute: () => [
    contribute(readmeTagline, "Bun"),
    contribute(
      readmeCommandNotes,
      `Hono requires Bun ${toolchainVersions.bun} or newer on PATH. Install it from https://bun.sh before running the server or its tests. Vite+ and full-stack web frameworks continue to run on Node.js.`
    ),
    contribute(packageJson, {
      path: ".",
      engines: { bun: `>=${toolchainVersions.bun}` },
    }),
  ],
  id: "bun",
  kind: "runtime",
  name: "Bun",
  description:
    "Bun runtime for the Hono server; web frameworks and tools stay on Node.js",
  homepage: "https://bun.sh",
  auxiliary: true,
  provides: ["node-runtime"],
  requires: ["hono-server"],
});
