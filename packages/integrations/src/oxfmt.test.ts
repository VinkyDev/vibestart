import oxfmt from "ultracite/oxfmt";
import { describe, expect, it } from "vite-plus/test";

import { formatWithProjectConfig } from "#/oxfmt.ts";

describe(formatWithProjectConfig, () => {
  it("formats afresh after a call that failed", async () => {
    // The formatter rejects a function value it cannot serialize; the key, built with JSON, drops it.
    await expect(
      formatWithProjectConfig("a.ts", "const a=1", "@app", {
        ...oxfmt,
        unserializable: () => null,
      })
    ).rejects.toThrow("cannot be represented");

    await expect(
      formatWithProjectConfig("a.ts", "const a=1", "@app", oxfmt)
    ).resolves.toMatchObject({ code: "const a = 1;\n", errors: [] });
  });
});
