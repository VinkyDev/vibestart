import { desktopChannels } from "@my-app/electron";
import type { DesktopVersions } from "@my-app/electron";
import { app, ipcMain } from "electron";

import { isTrustedUrl } from "#src/main/renderer-route.ts";

const versions = (): DesktopVersions => ({
  app: app.getVersion(),
  chrome: process.versions.chrome,
  electron: process.versions.electron,
  node: process.versions.node,
});

/** Every channel goes through here: a handler answers only frames the app itself loaded. */
export const setupIpc = (devOrigin: string | null) => {
  ipcMain.handle(desktopChannels.versions, (event) => {
    if (!isTrustedUrl(event.senderFrame?.url ?? "", devOrigin)) {
      throw new Error("Untrusted IPC sender");
    }
    return versions();
  });
};
