import { omit } from "es-toolkit/object";

import type { RegistryInfo, Stack } from "@vibestart/core";
import {
  blueprintJsonSchema,
  blueprintSchemaUrl,
  defaultAddons,
  generate,
  legalStacks,
  packageManagers,
} from "@vibestart/core";
import { verificationOf, registry, stackLabel } from "@vibestart/integrations";
import type { VerificationMatch } from "@vibestart/integrations";

import type {
  Project,
  VerificationIndex,
  StackPreview,
  StackVerification,
} from "../src/lib/project.ts";
import { projectKey } from "../src/lib/project.ts";

/** The name the CLI gives a project when it is not asked for one. */
export const previewName = "my-app";

const legal = new Map(
  legalStacks(registry).map((stack) => [stackLabel(stack), stack])
);

export const registryInfo: RegistryInfo = {
  addons: registry.addons.map((addon) => omit(addon, ["contribute"])),
  capabilities: registry.capabilities,
  integrations: registry.integrations.map((integration) =>
    omit(integration, ["contribute"])
  ),
  kindGroups: registry.kindGroups,
  kinds: registry.kinds,
};

/** The JSON Schema every generated `vibestart.jsonc` names, served from the site at its URL's path. */
export const blueprintSchema = {
  path: new URL(blueprintSchemaUrl).pathname.slice(1),
  source: JSON.stringify(blueprintJsonSchema(registry)),
};

export const stackLabels = [...legal.keys()];

const defaultVerification = async (stack: Stack) => {
  const addons = defaultAddons(registry);

  return await Promise.all([
    verificationOf(stack, addons),
    verificationOf(stack, addons, "bun"),
  ]);
};

/** Each pair indexes the summaries for a stack, in the resolver's registry order. */
export const verificationIndex = async (): Promise<VerificationIndex> => {
  const summaries: StackVerification[] = [];
  const indexes = new Map<string, number>();

  const intern = (match: VerificationMatch | undefined) => {
    if (match === undefined) {
      return null;
    }

    const summary = { label: match.label, verifiedAt: match.record.verifiedAt };
    const key = JSON.stringify(summary);
    let index = indexes.get(key);

    if (index === undefined) {
      index = summaries.length;
      summaries.push(summary);
      indexes.set(key, index);
    }

    return index;
  };

  const matches = await Promise.all(
    [...legal.values()].map(defaultVerification)
  );

  return {
    stacks: matches.map(([pnpm, bun]) => [intern(pnpm), intern(bun)]),
    summaries,
  };
};

/**
 * Every set of add-ons. A preview is generated ahead for each, so their count doubles with
 * each add-on; past a few, previews should generate on demand instead.
 */
const subsets = (ids: readonly string[]) => {
  let sets: string[][] = [[]];

  for (const id of ids.toReversed()) {
    sets = sets.flatMap((set) => [[id, ...set], set]);
  }

  return sets;
};

const projectSets = new Map(
  subsets(registry.addons.map((addon) => addon.id)).flatMap((addons) =>
    packageManagers.map(
      (packageManager) =>
        [
          projectKey(addons, packageManager),
          { addons, packageManager },
        ] as const
    )
  )
);

export const project = async (label: string, key: string): Promise<Project> => {
  const stack = legal.get(label);
  const selection = projectSets.get(key);
  const addons = selection?.addons;

  if (stack === undefined || addons === undefined || selection === undefined) {
    throw new Error(`No legal stack is labeled "${label}" with add-ons ${key}`);
  }

  const { files, gettingStarted, setup } = await generate(
    registry,
    {
      addons,
      channel: "recommended",
      packageManager: selection.packageManager,
      stack,
    },
    { name: previewName }
  );

  return {
    files,
    gettingStarted,
    setup,
    packageManager: selection.packageManager,
  };
};

/**
 * In the order of `projectSets`, so a build writes the same bytes for the same output. The stack's own pnpm
 * record rides along: the verification card loads this preview to show it.
 */
export const stackPreview = async (label: string): Promise<StackPreview> => {
  const stack = legal.get(label);

  if (stack === undefined) {
    throw new Error(`No legal stack is labeled "${label}"`);
  }

  const generated = await Promise.all(
    [...projectSets.keys()].map(
      async (key) => [key, await project(label, key)] as const
    )
  );

  const contents: string[] = [];
  const indexes = new Map<string, number>();

  const intern = (content: string) => {
    let index = indexes.get(content);

    if (index === undefined) {
      index = contents.length;
      contents.push(content);
      indexes.set(content, index);
    }

    return index;
  };

  const projects = Object.fromEntries(
    generated.map(([key, { files, ...rest }]) => [
      key,
      {
        ...rest,
        files: files.map((file) => ({
          ...file,
          content: intern(file.content),
        })),
      },
    ])
  );

  const [verification] = await defaultVerification(stack);

  return { contents, projects, verification: verification?.record ?? null };
};
