import { describe, expect, it, vi } from "vite-plus/test";

import { cached } from "#/lib/cached.ts";

describe(cached, () => {
  it("asks again after a create that throws before it returns a promise", async () => {
    const cache = new Map<string, Promise<string>>();

    const create = vi
      .fn<() => Promise<string>>()
      .mockImplementationOnce(() => {
        throw new Error("offline");
      })
      .mockResolvedValue("loaded");

    await expect(cached(cache, "key", create)).rejects.toThrow("offline");
    await expect(cached(cache, "key", create)).resolves.toBe("loaded");
    expect(cached(cache, "key", create)).toBe(cached(cache, "key", create));
    expect(create).toHaveBeenCalledTimes(2);
  });
});
