import { describe, expect, it } from "vite-plus/test";

import type { Stack } from "@vibestart/core";
import { generate, legalStacks } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { stackLabel } from "#/stack-label.ts";
import { verifiedAs, verifiedBlueprint, verifiedName } from "#/verification.ts";

const generateStack = async (stack: Stack) =>
  await generate(registry, verifiedBlueprint(stack), { name: verifiedName });

// The recorded blueprint names the deployment, and the README describes it.
const described = new Set(["README.md", "vibestart.jsonc"]);

const pairs = legalStacks(registry).flatMap((stack) => {
  const sibling = verifiedAs(stack);
  return sibling === stack
    ? []
    : [{ label: stackLabel(stack), sibling, stack }];
});

// `vp run ready` reads no documentation and no Docker file, so these pairs share one verification.
describe("a stack without a deployment is its Docker sibling without Docker", () => {
  it.each(pairs)("$label", async ({ sibling, stack }) => {
    const [bare, docker] = await Promise.all([
      generateStack(stack),
      generateStack(sibling),
    ]);
    const dockerFiles = new Map(docker.files.map((file) => [file.path, file]));
    const changed = bare.files.flatMap((file) => {
      const counterpart = dockerFiles.get(file.path);
      if (counterpart === undefined) {
        return [file.path];
      }
      return counterpart.content === file.content ||
        counterpart.owner === "docker" ||
        described.has(file.path)
        ? []
        : [file.path];
    });
    expect(changed).toStrictEqual([]);
    expect(bare.setup).toStrictEqual(docker.setup);
  });
});
