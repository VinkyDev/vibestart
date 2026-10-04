import {
  contribute,
  defineAddon,
  defineSlot,
  packageJson,
  renderFile,
} from "@vibestart/core";

import { readySteps, toolConventions } from "#/vite-plus/slots.ts";

export const knipEntries = defineSlot<{
  readonly workspace: string;
  readonly entry: readonly string[];
}>("knip/entries");

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
                    read(knipEntries).map(({ workspace, entry }) => [
                      workspace,
                      { entry },
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
