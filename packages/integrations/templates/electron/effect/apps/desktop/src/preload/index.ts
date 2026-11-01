import { Schema } from "effect";
import { contextBridge, ipcRenderer } from "electron";

import type { DesktopApi } from "@my-app/electron";
import {
  desktopBridgeGlobal,
  desktopChannels,
  DesktopVersions,
} from "@my-app/electron";

const decodeVersions = Schema.decodeUnknownSync(DesktopVersions);

const desktop: DesktopApi = {
  versions: async () =>
    decodeVersions(await ipcRenderer.invoke(desktopChannels.versions)),
};

contextBridge.exposeInMainWorld(desktopBridgeGlobal, desktop);
