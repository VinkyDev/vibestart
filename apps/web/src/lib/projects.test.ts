import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import type { StackPreview } from "#/lib/project.ts";
import { projectKey } from "#/lib/project.ts";
import { loadProject } from "#/lib/projects.ts";
import { verifiedAddons } from "#/lib/stack.ts";
import { stacks } from "#/lib/stacks.ts";

const preview: StackPreview = {
  contents: ["{}"],
  projects: {
    [projectKey(verifiedAddons)]: {
      files: [{ content: 0, owner: "core", path: "package.json" }],
      gettingStarted: [],
      packageManager: "pnpm",
      setup: [
        { run: "vp install", stage: "install", writes: ["pnpm-lock.yaml"] },
      ],
    },
  },
  verification: null,
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
    // The fingerprint check hashes the setup, so every field the generator wrote survives.
    expect(project.setup).toStrictEqual(
      preview.projects[projectKey(verifiedAddons)]?.setup
    );
    expect(loadProject(entry)).toBe(loadProject(entry));
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
