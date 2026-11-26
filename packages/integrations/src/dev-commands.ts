import type { Stack } from "@vibestart/core";

import { hasDevServers } from "#/app-shape.ts";

const server = "vp run dev";
const mobile = "vp run dev:mobile";

// The first command starts the project. Expo beside a server needs its own terminal.
export const devCommands = (stack: Stack) => {
  if (!hasDevServers(stack)) {
    return [mobile] as const;
  }

  return stack.mobile === undefined
    ? ([server] as const)
    : ([server, mobile] as const);
};
