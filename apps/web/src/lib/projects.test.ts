import { stacks } from "virtual:vibestart";
import { describe, expect, it } from "vite-plus/test";

import { hasPreview } from "#/lib/projects.ts";
import {
  commandLine,
  commandWords,
  entryFromFlags,
  verifiedAddons,
} from "#/lib/stack.ts";

describe("static project previews", () => {
  const entry = entryFromFlags({});

  it("offers two previews per stack regardless of the number of add-ons", () => {
    expect(
      stacks.every((stack) => Object.keys(stack.projects).length === 2)
    ).toBeTruthy();
  });

  it.each(["pnpm", "bun"] as const)(
    "keeps default previews and exact custom CLI flags under %s",
    (manager) => {
      expect(hasPreview(entry, verifiedAddons, manager)).toBeTruthy();
      expect(hasPreview(entry, [], manager)).toBeFalsy();
      expect(
        commandLine(commandWords({}, "my-app", manager, [], manager))
      ).toContain("--addons none");
    }
  );
});
