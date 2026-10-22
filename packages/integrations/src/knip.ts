import { groupBy } from "es-toolkit/array";

import {
  contribute,
  defineAddon,
  defineSlot,
  packageJson,
  renderFile,
} from "@vibestart/core";

import { readySteps, toolConventions } from "#/vite-plus/slots.ts";

/** `ignoreDependencies` lists packages a Knip plugin wrongly expects the workspace to install. */
interface KnipEntry {
  readonly workspace: string;
  readonly entry?: readonly string[];
  readonly ignoreDependencies?: readonly string[];
}

export const knipEntries = defineSlot<KnipEntry>("knip/entries");

const workspaceConfig = (entries: readonly KnipEntry[]) => {
  const entry = [...new Set(entries.flatMap((item) => item.entry ?? []))];

  const ignoreDependencies = [
    ...new Set(entries.flatMap((item) => item.ignoreDependencies ?? [])),
  ];

  return {
    entry: entry.length === 0 ? undefined : entry,
    ignoreDependencies:
      ignoreDependencies.length === 0 ? undefined : ignoreDependencies,
  };
};

export const knip = defineAddon({
  supportsAdd: true,
  contribute: (ctx) => [
    ...(knipEntries.values(ctx).length === 0
      ? []
      : [
          renderFile(
            "knip.json",
            (read) =>
              `${JSON.stringify(
                {
                  $schema: "https://unpkg.com/knip@6/schema.json",
                  workspaces: Object.fromEntries(
                    Object.entries(
                      groupBy(read(knipEntries), (entry) => entry.workspace)
                    ).map(([workspace, entries]) => [
                      workspace,
                      workspaceConfig(entries),
                    ])
                  ),
                },
                null,
                2
              )}\n`
          ),
        ]),
    contribute(packageJson, {
      devDependencies: ["knip"],
      path: ".",
      scripts: { knip: "knip" },
    }),
    contribute(readySteps, {
      command: "vp run knip",
      description: "unused files, exports, dependencies, and catalog entries",
      label: "knip",
      phase: "analyze",
    }),
    contribute(toolConventions, {
      text: "Delete what `vp run knip` reports: unused files, exports, dependencies, and catalog entries. Add a Knip config entry only when a plugin cannot see a real reference.",
      title: "Knip",
    }),
  ],
  default: true,
  description: "Finds unused files, exports, dependencies, and catalog entries",
  homepage: "https://knip.dev",
  id: "knip",
  name: "Knip",
});
