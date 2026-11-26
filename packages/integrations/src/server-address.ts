import type { Stack } from "@vibestart/core";

import { pageRendering, separateServers } from "#/app-shape.ts";

// A framework serving pages already occupies port 3000.
const defaultPort = (stack: Stack) => (separateServers(stack) ? 3001 : 3000);

const localhost = (port: number) => `http://localhost:${port}`;

export const devServer = (stack: Stack) => {
  const port = defaultPort(stack);

  return { origin: localhost(port), port };
};

export const devOrigin = (stack: Stack) => {
  const pages = pageRendering(stack);

  if (pages === "none") {
    return devServer(stack).origin;
  }

  return localhost(pages === "client" ? 5173 : 3000);
};

// The .env examples configure development. An executable launched without .env keeps its runtime defaults.
export const serverPort = (stack: Stack) => ({
  name: "PORT",
  example: String(devServer(stack).port),
  schema: `z.coerce.number().int().positive().default(${defaultPort(stack)})`,
});

export const serverUrl = (stack: Stack) => ({
  name: "SERVER_URL",
  example: devServer(stack).origin,
  schema: `z.url().default("${localhost(defaultPort(stack))}")`,
});
