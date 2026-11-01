import { Schema } from "effect";

export const desktopBridgeGlobal = "desktop";

// https, because clients such as Better Auth accept only http and https origins.
export const rendererHost = "app.localhost";
export const rendererOrigin = `https://${rendererHost}`;

export const desktopChannels = { versions: "desktop:versions" } as const;

export const DesktopVersions = Schema.Struct({
  app: Schema.String,
  chrome: Schema.String,
  electron: Schema.String,
  node: Schema.String,
});

export type DesktopVersions = typeof DesktopVersions.Type;

export interface DesktopApi {
  versions: () => Promise<DesktopVersions>;
}
