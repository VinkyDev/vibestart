import { BrowserWindow, shell } from "electron";

import { isExternalUrl, isTrustedUrl } from "#src/main/renderer-route.ts";

// The window shows the app and nothing else: other links open in the user's browser or mail client.
const openOutside = (target: string) => {
  if (isExternalUrl(target)) {
    void shell.openExternal(target);
  }
};

export const createMainWindow = ({
  devOrigin,
  preload,
  url,
}: {
  devOrigin: string | null;
  preload: string;
  url: string;
}) => {
  const win = new BrowserWindow({
    height: 800,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload,
      sandbox: true,
      webviewTag: false,
    },
    width: 1280,
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler((details) => {
    openOutside(details.url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, target) => {
    if (!isTrustedUrl(target, devOrigin)) {
      event.preventDefault();
      openOutside(target);
    }
  });

  void win.loadURL(url);
  return win;
};
