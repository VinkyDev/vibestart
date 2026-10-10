import { describe, expect, it } from "vite-plus/test";

import { resolveApiUrl } from "#src/lib/api-url.ts";

describe(resolveApiUrl, () => {
  it("prefers the configured origin", () => {
    expect(
      resolveApiUrl({
        configured: "https://api.example.com",
        dev: true,
        hostUri: "192.168.1.20:8081",
      })
    ).toBe("https://api.example.com");
  });

  it.each([
    ["192.168.1.20:8081", "http://192.168.1.20:3000"],
    ["10.0.2.2:8081", "http://10.0.2.2:3000"],
    ["localhost:8081", "http://localhost:3000"],
  ])("reaches the server beside Metro at %s in development", (hostUri, url) => {
    expect(resolveApiUrl({ configured: undefined, dev: true, hostUri })).toBe(
      url
    );
  });

  it("refuses a release build without an origin", () => {
    expect(() =>
      resolveApiUrl({
        configured: undefined,
        dev: false,
        hostUri: "192.168.1.20:8081",
      })
    ).toThrow("EXPO_PUBLIC_API_URL");
  });
});
