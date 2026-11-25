import { contribute, defineAddon, file, packageJson } from "@vibestart/core";

import { knipEntries } from "#/knip.ts";
import {
  ignoredFiles,
  readmeSections,
  rootTypeScriptFiles,
} from "#/vite-plus/slots.ts";

export const alchemy = defineAddon({
  id: "alchemy",
  name: "Alchemy",
  description:
    "Define cloud infrastructure in TypeScript with your choice of providers",
  homepage: "https://alchemy.run/",
  default: false,
  supportsAdd: true,
  contribute: (ctx) => [
    file(
      "alchemy.run.ts",
      [
        'import * as Alchemy from "alchemy";',
        'import { Effect, Layer } from "effect";',
        "",
        `export default Alchemy.Stack("${ctx.name}", {`,
        "  providers: Layer.empty,",
        "  state: Alchemy.localState(),",
        "}, Effect.succeed({}));",
        "",
      ].join("\n")
    ),
    contribute(rootTypeScriptFiles, "alchemy.run.ts"),
    contribute(ignoredFiles, ".alchemy/"),
    contribute(packageJson, {
      path: ".",
      devDependencies: [
        "alchemy",
        "effect",
        "@effect/platform-node",
        "@effect/platform-bun",
      ],
      scripts: {
        plan: "alchemy plan",
        deploy: "alchemy deploy",
        destroy: "alchemy destroy",
      },
    }),
    contribute(knipEntries, {
      workspace: ".",
      entry: ["alchemy.run.ts"],
    }),
    contribute(
      readmeSections,
      () =>
        "## Cloud infrastructure\n\nEdit `alchemy.run.ts` to provision resources with [Alchemy](https://alchemy.run/). Install the provider package for your cloud, register its provider layer, and declare resources in the stack. You can combine providers in one stack. The starter has no resources and uses local state under `.alchemy/`. Configure a durable shared state backend before deploying from CI. Run `vp run plan --stage dev` to inspect changes and `vp run deploy --stage dev` to apply them."
    ),
  ],
});
