import { z } from "zod";

export const desktopBridgeGlobal = "desktop";

// https, because clients such as Better Auth accept only http and https origins.
export const rendererHost = "app.localhost";
export const rendererOrigin = `https://${rendererHost}`;

export const desktopChannels = { versions: "desktop:versions" } as const;

export const versionsSchema = z.object({
  app: z.string(),
  chrome: z.string(),
  electron: z.string(),
  node: z.string(),
});

export type DesktopVersions = z.infer<typeof versionsSchema>;

export interface DesktopApi {
  versions: () => Promise<DesktopVersions>;
}
