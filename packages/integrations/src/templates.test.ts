import { describe, expect, it } from "vite-plus/test";

import { templatePaths } from "#/templates.ts";

describe("templates", () => {
  it("hold no dot-file, which the template glob would skip", () => {
    expect(
      templatePaths.filter((templatePath) =>
        templatePath.split("/").some((segment) => segment.startsWith("."))
      )
    ).toStrictEqual([]);
  });
});
