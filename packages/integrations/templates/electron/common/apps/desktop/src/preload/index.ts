import { contextBridge, ipcRenderer } from "electron";

import type { DesktopApi } from "@my-app/electron";
import {
  desktopBridgeGlobal,
  desktopChannels,
  versionsSchema,
} from "@my-app/electron";

const desktop: DesktopApi = {
  versions: async () =>
    versionsSchema.parse(await ipcRenderer.invoke(desktopChannels.versions)),
};

contextBridge.exposeInMainWorld(desktopBridgeGlobal, desktop);
