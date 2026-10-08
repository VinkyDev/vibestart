import { describe, expect, it } from "vite-plus/test";

import { noteText } from "../src/lib/i18n.ts";
import { projectKey } from "../src/lib/project.ts";
import { verifiedAddons } from "../src/lib/stack.ts";
import { overwriteGetLocale } from "../src/paraglide/runtime.js";
import { importStacks } from "./index.ts";

const { stackLabels, stackPreview, stackProject } = await importStacks();
const defaultKey = projectKey(verifiedAddons);

describe(stackPreview, () => {
  it("holds every project of the stack, each content once", async () => {
    const label = "spa-hono-orpc-postgres-better-auth-docker-e2e";
    const { contents, projects } = await stackPreview(label);
    expect(new Set(contents).size).toBe(contents.length);
    const expanded = Object.entries(projects).map(([key, project]) => [
      key,
      {
        ...project,
        files: project.files.map((file) => ({
          ...file,
          content: contents[file.content],
        })),
      },
    ]);
    const generated = await Promise.all(
      Object.keys(projects).map(
        async (key) => [key, await stackProject(label, key)] as const
      )
    );
    expect(expanded).toStrictEqual(generated);
    expect(Object.keys(projects)).toHaveLength(8);
  });
});

describe("getting-started notes", () => {
  it("word every note as the messages do", { timeout: 120_000 }, async () => {
    overwriteGetLocale(() => "en");
    const projects = await Promise.all(
      stackLabels.map(async (label) => await stackProject(label, defaultKey))
    );
    const notes = projects.flatMap(({ gettingStarted }) =>
      gettingStarted.flatMap(({ note }) => note ?? [])
    );
    expect(notes).not.toHaveLength(0);
    for (const note of notes) {
      expect(noteText(note)).toBe(note.text);
    }
  });
});
