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

import type { Project, StackSummary } from "../src/lib/project.ts";
import { addonsKey, projectKey } from "../src/lib/project.ts";

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

export const stackSummaries = async (): Promise<StackSummary[]> =>
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
 * Every set of add-ons, by `addonsKey`. A preview is generated ahead for each, so their count doubles with
 * each add-on; past a few, previews should generate on demand instead.
 */
const subsets = (ids: readonly string[]) => {
  let sets: string[][] = [[]];
  for (const id of ids.toReversed()) {
    sets = sets.flatMap((set) => [[id, ...set], set]);
  }
  return sets;
};

const addonSets = new Map(
  subsets(registry.addons.map((addon) => addon.id)).map((set) => [
    addonsKey(set),
    set,
  ])
);

export const projectSets = new Map(
  [...addonSets.values()].flatMap((addons) =>
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
