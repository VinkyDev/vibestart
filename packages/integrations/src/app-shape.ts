import type { Stack } from "@vibestart/core";

export const pageRendering = (stack: Stack) => {
  if (stack.framework === undefined) {
    return "none";
  }

  return stack.framework === "spa" ? "client" : "server";
};

export const backendHost = (stack: Stack) => {
  if (stack.backend === undefined) {
    return "none";
  }

  return stack.backend === "self" ? "framework" : "standalone";
};

export const hasBackend = (stack: Stack) => stack.backend !== undefined;
export const hasWebApp = (stack: Stack) => stack.framework !== undefined;

// Metro runs in its own interactive terminal.
export const hasDevServers = (stack: Stack) =>
  hasWebApp(stack) || hasBackend(stack);

export const staticSite = (stack: Stack) =>
  pageRendering(stack) === "client" && !hasBackend(stack);

export const separateServers = (stack: Stack) =>
  pageRendering(stack) === "server" && backendHost(stack) === "standalone";
