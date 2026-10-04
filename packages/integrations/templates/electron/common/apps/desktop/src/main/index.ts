import path from "node:path";

import { rendererOrigin } from "@my-app/electron";
import { app, BrowserWindow } from "electron";

import { defaultApiOrigin } from "#src/main/config.ts";
import { setupIpc } from "#src/main/ipc.ts";
import {
  parseHttpOrigin,
  parseLoopbackOrigin,
} from "#src/main/renderer-route.ts";
import { serveRenderer } from "#src/main/renderer.ts";
import { createMainWindow } from "#src/main/window.ts";

const origin = (name: string, parse: (value: string) => string | null) => {
  const value = process.env[name];
  if (value === undefined || value === "") {
    return null;
  }
  const parsed = parse(value);
  if (parsed === null) {
    throw new Error(`${name} is not a valid origin: ${value}`);
  }
  return parsed;
};

const devOrigin = origin("ELECTRON_RENDERER_URL", parseLoopbackOrigin);
const apiOrigin =
  origin("API_ORIGIN", parseHttpOrigin) ?? parseHttpOrigin(defaultApiOrigin);
if (apiOrigin === null) {
  throw new Error(`defaultApiOrigin is not an origin: ${defaultApiOrigin}`);
}

const open = () =>
  createMainWindow({
    devOrigin,
    preload: path.join(import.meta.dirname, "../preload/index.cjs"),
    url: devOrigin ?? `${rendererOrigin}/`,
  });

const start = () => {
  setupIpc(devOrigin);
  if (devOrigin === null) {
    serveRenderer({
      apiOrigin,
      rendererRoot: path.join(import.meta.dirname, "../renderer"),
    });
  }
  open();
};

if (app.requestSingleInstanceLock()) {
  // No top-level `await`: Electron starts the app only after the main module finishes evaluating.
  app.on("ready", start);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      open();
    }
  });
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    win?.focus();
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
} else {
  app.quit();
}
