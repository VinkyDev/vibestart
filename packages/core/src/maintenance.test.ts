import { describe, expect, it } from "vite-plus/test";

import { mergeFile } from "#/maintenance.ts";

describe("three-way template maintenance", () => {
  it("combines independent local and template edits", () => {
    expect(
      mergeFile("config.ts", "a\nb\nc\n", "local\nb\nc\n", "a\nb\ntarget\n")
    ).toMatchObject({ after: "local\nb\ntarget\n", conflict: false });
  });

  it("keeps both edits visible when they overlap", () => {
    const result = mergeFile("config.ts", "a\n", "local\n", "target\n");
    expect(result.conflict).toBeTruthy();
    expect(result.after).toContain("local");
    expect(result.after).toContain("target");
  });

  it("distinguishes file absence from empty contents and preserves ownership removals", () => {
    expect(mergeFile("a", null, "", "new").conflict).toBeTruthy();
    expect(mergeFile("a", "old", "edited", null).after).toBe("edited");
    expect(mergeFile("a", "old", null, "new")).toMatchObject({
      after: "new",
      conflict: true,
    });
  });

  it("keeps a project file the template now also adds, beside the template's version", () => {
    expect(
      mergeFile("Dockerfile", null, "FROM business\n", "FROM template\n").after
    ).toBe(
      "<<<<<<< project\nFROM business\n=======\nFROM template\n>>>>>>> target template\n"
    );
  });

  it("preserves JSONC comments and custom scripts while updating a nearby catalog key", () => {
    const base = '{"catalog":{"hono":"1"},"scripts":{"ready":"vp check"}}';
    const local =
      '{// business configuration\n"catalog":{"hono":"1"},"scripts":{"ready":"vp check","business":"test"}}';
    const target =
      '{"catalog":{"hono":"2"},"scripts":{"ready":"vp check && knip"}}';
    const result = mergeFile("package.json", base, local, target);
    expect(result.conflict).toBeFalsy();
    expect(result.after).toContain("// business configuration");
    expect(result.after).toContain('"business":"test"');
    expect(result.after).toContain('"2"');
    expect(result.after).toContain("vp check && knip");
  });

  it("treats competing dependency changes as conflicts", () => {
    expect(
      mergeFile(
        "package.json",
        '{"dep":"1"}',
        '{"dep":"custom"}',
        '{"dep":"2"}'
      ).conflict
    ).toBeTruthy();
  });

  it("rejects invalid JSON rather than treating it as an empty object", () => {
    expect(() =>
      mergeFile("package.json", "{}", "{ broken }", '{"new":true}')
    ).toThrow("Invalid JSONC");
  });
});
