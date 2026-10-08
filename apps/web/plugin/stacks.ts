import { omit } from "es-toolkit/object";

import type { RegistryInfo } from "@vibestart/core";
import { defaultAddons, generate, legalStacks } from "@vibestart/core";
import {
  bunSubjectOf,
  registry,
  stackLabel,
  verificationOf,
  verifiedAs,
} from "@vibestart/integrations";

import type { Project, StackEntry, StackPreview } from "../src/lib/project.ts";
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

export const stackLabels = [...legal.keys()];

export const stackEntries = async (): Promise<StackEntry[]> =>
  await Promise.all(
    [...legal].map(async ([label, stack]) => {
      const [verification, bunVerification] = await Promise.all([
        verificationOf(stack, defaultAddons(registry)),
        verificationOf(stack, defaultAddons(registry), "bun"),
      ]);
      return {
        label,
        stack,
        bunVerification:
          bunVerification === undefined
            ? null
            : {
                ...bunVerification,
                label: `${stackLabel(bunSubjectOf(stack))}-bun-pm`,
              },
        verification:
          verification === undefined
            ? null
            : { ...verification, label: stackLabel(verifiedAs(stack)) },
      };
    })
  );

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
    (["pnpm", "bun"] as const).map(
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

/** In the order of `projectSets`, so a build writes the same bytes for the same output. */
export const stackPreview = async (label: string): Promise<StackPreview> => {
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
  return { contents, projects };
};
