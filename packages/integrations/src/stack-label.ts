import type { PackageManager, Stack } from "@vibestart/core";

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

/** Bun and pnpm generate the same sources, so a Bun package-manager task keeps the stack label and adds this suffix. */
export const taskLabel = (
  stack: Stack,
  packageManager: PackageManager = "pnpm"
) =>
  packageManager === "bun" ? `${stackLabel(stack)}-bun-pm` : stackLabel(stack);
