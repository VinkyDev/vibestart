import { describe, expect, it } from "vite-plus/test";

import { generate, legalStacks } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { stackLabel } from "#/stack-label.ts";
import {
  verifiedBlueprint,
  verifiedName,
  verifiedStacks,
} from "#/verification.ts";

const stacks = legalStacks(registry);

// Each other stack is its Docker sibling without Docker's files (deployment.test.ts).
const generations = await Promise.all(
  verifiedStacks.map(async (stack) => ({
    label: stackLabel(stack),
    ...(await generate(registry, verifiedBlueprint(stack), {
      name: verifiedName,
    })),
  }))
);

/** Adds `label` to the stacks that render `content`. */
const add = (
  variants: Map<string, string[]>,
  content: string,
  label: string
) => {
  variants.set(content, [...(variants.get(content) ?? []), label]);
};

const owners = new Map<string, Map<string, Map<string, string[]>>>();
const setups = new Map<string, string[]>();
for (const { files, label, setup } of generations) {
  for (const file of files) {
    const paths =
      owners.get(file.owner) ?? new Map<string, Map<string, string[]>>();
    owners.set(file.owner, paths);
    const variants = paths.get(file.path) ?? new Map<string, string[]>();
    paths.set(file.path, variants);
    add(variants, file.content, label);
  }
  add(
    setups,
    `${setup.map((command) => `${command.run}  # writes ${command.writes.join(", ")}`).join("\n")}\n`,
    label
  );
}

/**
 * Each distinct content once, under the stacks that render it, so a template change is one hunk however many
 * stacks render the template.
 */
const render = (title: string, variants: ReadonlyMap<string, string[]>) =>
  [...variants]
    .map(([content, labels]) => ({ content, labels: labels.toSorted() }))
    .toSorted((a, b) => (a.labels[0] ?? "").localeCompare(b.labels[0] ?? ""))
    .map(({ content, labels }) =>
      [
        `# ${title} · ${labels.length} ${labels.length === 1 ? "stack" : "stacks"}`,
        ...labels.map((label) => `#   ${label}`),
        content,
      ].join("\n")
    );

describe("stack snapshots", () => {
  it("every legal stack has a distinct name", () => {
    expect(new Set(stacks.map(stackLabel)).size).toBe(stacks.length);
  });

  it("setup", async () => {
    await expect(render("setup", setups).join("\n")).toMatchFileSnapshot(
      "__snapshots__/setup.txt"
    );
  });

  it.each([...owners.keys()].toSorted())("%s", async (owner) => {
    const paths = owners.get(owner) ?? new Map<string, Map<string, string[]>>();
    const rendered = [...paths]
      .toSorted(([a], [b]) => a.localeCompare(b))
      .flatMap(([file, variants]) => render(file, variants))
      .join("\n");
    await expect(rendered).toMatchFileSnapshot(
      `__snapshots__/owners/${owner}.txt`
    );
  });
});
