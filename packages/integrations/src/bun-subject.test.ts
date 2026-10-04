import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

import type { Generation, PackageManager, Stack } from "@vibestart/core";
import { generate } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { stackLabel } from "#/stack-label.ts";
import {
  bunSubjectOf,
  bunSubjects,
  verifiedBlueprint,
  verifiedName,
  verifiedStacks,
} from "#/verification.ts";

// Bun moves the workspace and catalog into package.json, trusts the install scripts it must run, and builds its image
// with Bun; the recorded blueprint names the package manager.
const bunOwned = new Set([
  "Dockerfile",
  "package.json",
  "pnpm-workspace.yaml",
  "vibestart.jsonc",
]);

const manifestSchema = z.looseObject({
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
  overrides: z.record(z.string(), z.string()).optional(),
  peerDependencies: z.record(z.string(), z.string()).optional(),
  trustedDependencies: z.array(z.string()).optional(),
  workspaces: z
    .object({ catalog: z.record(z.string(), z.string()) })
    .optional(),
});

const generated = new Map<string, Promise<Generation>>();
const generation = async (stack: Stack, packageManager: PackageManager) => {
  const key = `${stackLabel(stack)} ${packageManager}`;
  const cached = generated.get(key);
  if (cached !== undefined) {
    return await cached;
  }
  const pending = generate(registry, verifiedBlueprint(stack, packageManager), {
    name: verifiedName,
  });
  generated.set(key, pending);
  return await pending;
};

const manifests = ({ files }: Generation) =>
  files
    .filter((file) => file.path.endsWith("package.json"))
    .map((file) => manifestSchema.parse(JSON.parse(file.content)));

const dependencyNames = (project: Generation) =>
  new Set(
    manifests(project).flatMap((manifest) =>
      [
        manifest.dependencies,
        manifest.devDependencies,
        manifest.peerDependencies,
      ].flatMap((group) => Object.keys(group ?? {}))
    )
  );

const root = (project: Generation) => {
  const file = project.files.find(({ path }) => path === "package.json");
  return manifestSchema.parse(JSON.parse(file?.content ?? ""));
};

const missingFrom = (part: Iterable<string>, whole: ReadonlySet<string>) =>
  [...part].filter((item) => !whole.has(item));

describe("Bun verification stands for the stacks its subject covers", () => {
  it("is carried out by stacks no other stack covers", () => {
    expect(bunSubjects.map(stackLabel)).toStrictEqual(
      [...new Set(verifiedStacks.map(bunSubjectOf))].map(stackLabel)
    );
  });

  it.each(verifiedStacks.map((stack) => ({ label: stackLabel(stack), stack })))(
    "$label",
    async ({ stack }) => {
      const subject = bunSubjectOf(stack);
      const [pnpm, bun, subjectBun] = await Promise.all([
        generation(stack, "pnpm"),
        generation(stack, "bun"),
        generation(subject, "bun"),
      ]);

      // The sources and tests Bun runs are the ones pnpm verified.
      const pnpmFiles = new Map(pnpm.files.map((file) => [file.path, file]));
      const bunFiles = new Map(bun.files.map((file) => [file.path, file]));
      const changed = [...new Set([...pnpmFiles.keys(), ...bunFiles.keys()])]
        .filter(
          (path) => pnpmFiles.get(path)?.content !== bunFiles.get(path)?.content
        )
        .filter((path) => !bunOwned.has(path));
      expect(changed).toStrictEqual([]);

      // What Bun installs and trusts is included in what the subject installed and trusted.
      const names = dependencyNames(subjectBun);
      expect(missingFrom(dependencyNames(bun), names)).toStrictEqual([]);
      const own = root(bun);
      const wide = root(subjectBun);
      expect(
        missingFrom(
          own.trustedDependencies ?? [],
          new Set(wide.trustedDependencies)
        )
      ).toStrictEqual([]);
      expect(
        missingFrom(
          Object.keys(own.overrides ?? {}),
          new Set(Object.keys(wide.overrides ?? {}))
        )
      ).toStrictEqual([]);
      const wideCatalog = wide.workspaces?.catalog ?? {};
      expect(
        Object.entries(own.workspaces?.catalog ?? {}).filter(
          ([name, range]) => wideCatalog[name] !== range
        )
      ).toStrictEqual([]);
    }
  );
});
