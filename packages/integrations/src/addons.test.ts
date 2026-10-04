import nodePath from "node:path";

import oxfmt from "ultracite/oxfmt";
import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

import type { Generation } from "@vibestart/core";
import { defaultAddons, generate } from "@vibestart/core";

import { formatWithProjectConfig } from "#/oxfmt.ts";
import { registry } from "#/registry.ts";
import { stackLabel } from "#/stack-label.ts";
import {
  verifiedBlueprint,
  verifiedName,
  verifiedStacks,
} from "#/verification.ts";

// The recorded blueprint names the add-ons, and the documents list their commands and conventions.
const described = new Set(["AGENTS.md", "README.md", "vibestart.jsonc"]);

const manifestSchema = z.looseObject({
  devDependencies: z.record(z.string(), z.string()),
  scripts: z.record(z.string(), z.string()),
});

const manifestOf = ({ files }: Generation) =>
  manifestSchema.parse(
    JSON.parse(
      files.find((file) => file.path === "package.json")?.content ?? ""
    )
  );

const contentOf = ({ files }: Generation, filePath: string) =>
  files.find((file) => file.path === filePath)?.content ?? "";

/** Whether `part` is `whole` with some items left out, the rest in order. */
const isSubsequence = (part: readonly string[], whole: readonly string[]) => {
  let at = 0;
  for (const item of whole) {
    if (item === part[at]) {
      at += 1;
    }
  }
  return at === part.length;
};

const defaults = defaultAddons(registry);
const cases = verifiedStacks.flatMap((stack) =>
  [...defaults.map((addon) => [addon]), defaults].map((removed) => ({
    removed,
    label: `${stackLabel(stack)} without ${removed.join(", ")}`,
    stack,
  }))
);

// Removing a formatting preset may reflow code, but must not change its contents.
const canonical = async (filePath: string, content: string) => {
  if (!/\.(?:css|html|js|json|jsonc|md|mjs|ts|tsx|ya?ml)$/u.test(filePath)) {
    return content;
  }
  const { code, errors } = await formatWithProjectConfig(
    filePath,
    content,
    `@${verifiedName}`,
    { ...oxfmt, objectWrap: "collapse" }
  );
  expect(errors).toStrictEqual([]);
  return code;
};

// `stacks verify` runs each stack with the default add-ons, so leaving one out must leave every other check as it was.
describe("leaving out a default add-on removes only its own checks", () => {
  it.each(cases)("$label", async ({ removed, stack }) => {
    const full = verifiedBlueprint(stack);
    const [taken, left] = await Promise.all([
      generate(registry, full, { name: verifiedName }),
      generate(
        registry,
        { ...full, addons: full.addons.filter((id) => !removed.includes(id)) },
        { name: verifiedName }
      ),
    ]);
    expect(left.setup).toStrictEqual(taken.setup);

    const leftPaths = new Set(left.files.map((file) => file.path));
    // Only the add-on's files go: those it owns, and the config files an integration writes for it, named after it.
    expect(
      taken.files
        .filter((file) => !leftPaths.has(file.path))
        .filter(
          (file) =>
            !removed.includes(file.owner) &&
            !removed.some((addon) =>
              nodePath.basename(file.path).startsWith(addon)
            )
        )
        .map((file) => file.path)
    ).toStrictEqual([]);

    const manifests = new Set(["package.json", "pnpm-workspace.yaml"]);
    const changed = left.files.filter(
      (file) =>
        file.content !== contentOf(taken, file.path) &&
        !described.has(file.path) &&
        !manifests.has(file.path) &&
        !(removed.includes("ultracite") && file.path === "vite.config.ts")
    );
    const testConfig = (generation: Generation) => {
      const config = contentOf(generation, "vite.config.ts");
      return `export default {\n${config.slice(config.indexOf("\n  test: {") + 1).replace(/\}\);\s*$/u, "};")}`;
    };
    const compared = [
      ...changed.map((file) => ({
        path: file.path,
        before: contentOf(taken, file.path),
        after: file.content,
      })),
      {
        path: "test-config.ts",
        before: testConfig(taken),
        after: testConfig(left),
      },
    ];
    const normalized = await Promise.all(
      compared.map(async ({ path, before, after }) => ({
        path,
        before: await canonical(path, before),
        after: await canonical(path, after),
      }))
    );
    expect(
      normalized.map(({ path, after }) => ({ path, content: after }))
    ).toStrictEqual(
      normalized.map(({ path, before }) => ({ path, content: before }))
    );

    // The root manifest loses scripts and dependencies, and `ready` loses steps; what stays is unchanged.
    // The workspace file loses catalog entries and nothing else.
    const [before, after] = [manifestOf(taken), manifestOf(left)];
    const { ready = "", ...scripts } = after.scripts;
    expect(before).toMatchObject({ ...after, scripts });
    expect([
      isSubsequence(
        ready.split(" && "),
        (before.scripts.ready ?? "").split(" && ")
      ),
      isSubsequence(
        contentOf(left, "pnpm-workspace.yaml").split("\n"),
        contentOf(taken, "pnpm-workspace.yaml").split("\n")
      ),
    ]).toStrictEqual([true, true]);
  });
});
