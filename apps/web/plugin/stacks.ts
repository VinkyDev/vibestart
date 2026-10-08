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

/** Every set of add-ons. A stack's preview holds a project for each, under each package manager. */
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

export const stackProject = async (
  label: string,
  key: string
): Promise<Project> => {
  const stack = legal.get(label);
  const selection = projectSets.get(key);
  if (stack === undefined || selection === undefined) {
    throw new Error(`No legal stack is labeled "${label}" with add-ons ${key}`);
  }
  const { files, gettingStarted, setup } = await generate(
    registry,
    { ...selection, channel: "recommended", stack },
    { name: previewName }
  );
  return {
    files,
    gettingStarted,
    packageManager: selection.packageManager,
    setup,
  };
};

/** Each content is stored once, in the order of `projectSets`, so a build writes the same bytes for the same output. */
export const stackPreview = async (label: string): Promise<StackPreview> => {
  const generated = await Promise.all(
    [...projectSets.keys()].map(
      async (key) => [key, await stackProject(label, key)] as const
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
    generated.map(([key, project]) => [
      key,
      {
        ...project,
        files: project.files.map((file) => ({
          ...file,
          content: intern(file.content),
        })),
      },
    ])
  );
  return { contents, projects };
};
