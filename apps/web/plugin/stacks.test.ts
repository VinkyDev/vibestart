import { limitAsync } from "es-toolkit/promise";
import { describe, expect, it } from "vite-plus/test";

import { noteText } from "../src/lib/i18n.ts";
import { overwriteGetLocale } from "../src/paraglide/runtime.js";
import { importStacks } from "./index.ts";

const { stackLabels, stackPreview } = await importStacks();
const previews = Promise.all(stackLabels.map(limitAsync(stackPreview, 4)));

describe("stack previews", () => {
  it(
    "store each content once, and every file points at one",
    { timeout: 180_000 },
    async () => {
      for (const { contents, projects } of await previews) {
        expect(new Set(contents).size).toBe(contents.length);
        expect(Object.keys(projects)).toHaveLength(8);
        for (const project of Object.values(projects)) {
          for (const file of project.files) {
            expect(contents[file.content]).toBeTypeOf("string");
          }
        }
      }
    }
  );

  it(
    "word every getting-started note as the messages do",
    { timeout: 180_000 },
    async () => {
      overwriteGetLocale(() => "en");
      const generated = await previews;
      const notes = generated.flatMap(({ projects }) =>
        Object.values(projects).flatMap(({ gettingStarted }) =>
          gettingStarted.flatMap(({ note }) => note ?? [])
        )
      );
      expect(notes).not.toHaveLength(0);
      for (const note of notes) {
        expect(noteText(note)).toBe(note.text);
      }
    }
  );
});
