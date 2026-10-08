import { describe, expect, it } from "vite-plus/test";

import type { Project } from "#/maintenance/model.ts";
import { serialize } from "#/maintenance/model.ts";
import { snapshotAt, verifiedSnapshot } from "#/maintenance/release.ts";

const project: Pick<Project, "blueprint" | "name"> = {
  blueprint: {
    addons: [],
    channel: "recommended",
    packageManager: "pnpm",
    stack: { backend: "hono" },
  },
  name: "business",
};
const exported = ({
  addons = project.blueprint.addons,
  name = project.name,
  version = "1.0.0",
}: {
  readonly addons?: readonly string[];
  readonly name?: string;
  readonly version?: string;
}) =>
  serialize({
    blueprint: { ...project.blueprint, addons },
    files: [],
    name,
    schemaVersion: 1,
    version,
  });

describe("release snapshots", () => {
  it("rejects non-version targets before running a package manager", async () => {
    await expect(
      snapshotAt("latest; echo unsafe", project)
    ).rejects.toMatchObject({ exitCode: 2 });
  });

  it("accepts the files a release generated for exactly this project", () => {
    expect(verifiedSnapshot(exported({}), "1.0.0", project)).toMatchObject({
      name: "business",
      version: "1.0.0",
    });
  });

  it.each([
    [{ name: "other" }, "different identity"],
    [{ version: "1.0.1" }, "different identity"],
    [{ addons: ["knip"] }, "changed the project's choices"],
  ])("refuses a base generated for another project (%o)", (output, error) => {
    expect(() => verifiedSnapshot(exported(output), "1.0.0", project)).toThrow(
      error
    );
  });
});
