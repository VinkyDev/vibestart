import type { Stack } from "@vibestart/core";

export const stackLabel = (stack: Stack) =>
  [
    stack.framework,
    stack.backend,
    stack.api,
    stack.database,
    stack.auth,
    stack.desktop,
    ...(stack.runtime === "bun" ? ["bun"] : []),
    stack.deployment,
    ...(stack.testing === "e2e" ? ["e2e"] : []),
  ]
    .filter((id) => id !== undefined)
    .join("-");
