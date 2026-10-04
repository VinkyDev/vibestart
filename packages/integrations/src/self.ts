import { defineIntegration } from "@vibestart/core";

// The server is the full-stack framework's own: it owns the server files and branches on `ctx.has("self")`.
// It exists only for an API or a database; a framework with neither renders its pages without it.
export const self = defineIntegration({
  auxiliary: true,
  contribute: () => [],
  id: "self",
  kind: "backend",
  name: "Framework server",
  description: "API routes served by the frontend framework, beside its pages",
  provides: ["http-server"],
  requires: ["fullstack-framework"],
});
