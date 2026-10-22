import { defineIntegration } from "@vibestart/core";

export const workers = defineIntegration({
  auxiliary: true,
  contribute: () => [],
  description: "Cloudflare Workers runtime, deployed with Void",
  homepage: "https://developers.cloudflare.com/workers/",
  id: "workers",
  kind: "runtime",
  name: "Cloudflare Workers",
  provides: ["workers-runtime"],
  requires: ["cloudflare-deployment"],
});
