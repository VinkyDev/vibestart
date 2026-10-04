import { describe, expect, it } from "vite-plus/test";

import { registry } from "#/registry.ts";

describe("the registry", () => {
  it("links every third-party integration to its official site over HTTPS", () => {
    // `self` is vibestart's own glue: the framework's server routes, with no project of its own.
    const linked = [...registry.integrations, ...registry.addons].filter(
      ({ id }) => id !== "self"
    );
    expect(
      linked
        .filter(({ homepage }) => homepage === undefined)
        .map(({ id }) => id)
    ).toStrictEqual([]);
    for (const { homepage } of linked) {
      expect(new URL(homepage ?? "").protocol).toBe("https:");
    }
  });
});
