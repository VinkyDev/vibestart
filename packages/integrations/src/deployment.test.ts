import { describe, expect, it } from "vite-plus/test";

import { legalStacks } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { stackLabel } from "#/stack-label.ts";
import { verifiedAs, verifiedGeneration } from "#/verification.ts";

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
      verifiedGeneration(stack),
      verifiedGeneration(sibling),
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

const dockerStacks = legalStacks(registry)
  .filter((stack) => stack.deployment === "docker")
  .map((stack) => ({ label: stackLabel(stack), stack }));

/** The distinct `app` groups the pattern matches in `text`, sorted. */
const apps = (text: string, pattern: RegExp) =>
  [
    ...new Set([...text.matchAll(pattern)].map((match) => match.groups?.app)),
  ].toSorted((a, b) => (a ?? "").localeCompare(b ?? ""));

/** The apps a Dockerfile command selects with `--filter "<scope>/<app>..."`. */
const filtered = (dockerfile: string, command: string) =>
  apps(
    dockerfile.split("\n").find((line) => line.startsWith(`RUN ${command}`)) ??
      "",
    /--filter "@[^/]+\/(?<app>[^."]+)\.\.\."/gu
  );

// An Electron app beside the web app would otherwise be installed and built in the image and never used.
describe("the Docker build installs and builds the apps the image runs, and no other", () => {
  it.each(dockerStacks)("$label", async ({ stack }) => {
    const { files } = await verifiedGeneration(stack);
    const dockerfile =
      files.find((file) => file.path === "Dockerfile")?.content ?? "";
    const copied = apps(
      dockerfile,
      /^COPY --from=build \/app\/apps\/(?<app>[^/]+)\//gmu
    );
    expect(copied).not.toStrictEqual([]);
    expect(filtered(dockerfile, "vp install")).toStrictEqual(copied);
    expect(filtered(dockerfile, "vp run")).toStrictEqual(copied);
  });
});
