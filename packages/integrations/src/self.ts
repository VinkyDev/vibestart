import { defineIntegration } from "@vibestart/core";

// The full-stack framework owns the server files.
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
