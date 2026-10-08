import { stacks } from "virtual:vibestart";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import type { StackPreview } from "#/lib/project.ts";
import { projectKey } from "#/lib/project.ts";
import { loadProject } from "#/lib/projects.ts";
import { verifiedAddons } from "#/lib/stack.ts";

const preview: StackPreview = {
  contents: ["{}"],
  projects: {
    [projectKey(verifiedAddons)]: {
      files: [{ content: 0, owner: "core", path: "package.json" }],
      gettingStarted: [],
      packageManager: "pnpm",
      setup: [],
    },
  },
};

describe(loadProject, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks again after a failed request, and keeps a loaded project", async () => {
    const [entry] = stacks;
    if (entry === undefined) {
      throw new Error("The registry has no legal stack");
    }
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue(Response.json(preview));
    vi.stubGlobal("fetch", fetch);

    await expect(loadProject(entry)).rejects.toThrow("Failed to fetch");
    const project = await loadProject(entry);
    expect(project.files).toStrictEqual([
      { content: "{}", owner: "core", path: "package.json" },
    ]);
    expect(loadProject(entry)).toBe(loadProject(entry));
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
