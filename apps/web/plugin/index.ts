import path from "node:path";

import type { Plugin } from "vite-plus";
import { runnerImport } from "vite-plus";

import type { Project } from "../src/lib/project.ts";
import type * as Stacks from "./stacks.ts";

const moduleId = "virtual:vibestart";
const projectPrefix = `${moduleId}/project/`;
const resolved = (id: string) => `\0${id}`;

/** A module whose default export is one project; `JSON.parse` of a string literal parses faster than an object literal. */
const jsonModule = (project: Project) =>
  `export default JSON.parse(${JSON.stringify(JSON.stringify(project))});`;

/**
 * Serves the registry, every legal stack, and each stack's generated project with each set of add-ons as
 * virtual modules, one lazy chunk per project. The generator formats with oxfmt's native binding, so it runs here in Node, not in the browser.
 */
export const vibestart = (): Plugin => {
  let stacks: Promise<typeof Stacks> | undefined;
  const loadStacks = async () => {
    stacks ??= (async () => {
      const imported = await runnerImport<typeof Stacks>("/plugin/stacks.ts", {
        oxc: { exclude: ["**/templates/**"] },
        root: path.dirname(import.meta.dirname),
      });
      return imported.module;
    })();
    return await stacks;
  };

  return {
    load: async (id) => {
      if (id === resolved(moduleId)) {
        const loaded = await loadStacks();
        const summaries = await loaded.stackSummaries();
        const entries = summaries.map((summary) => {
          const projects = [...loaded.projectSets.keys()].map(
            (key) =>
              `${JSON.stringify(key)}: () => import(${JSON.stringify(`${projectPrefix}${summary.label}/${key}`)}).then((module) => module.default)`
          );
          return `{ ...${JSON.stringify(summary)}, projects: { ${projects.join(", ")} } }`;
        });
        return [
          `export const previewName = ${JSON.stringify(loaded.previewName)};`,
          `export const registry = ${JSON.stringify(loaded.registryInfo)};`,
          `export const stacks = [${entries.join(",\n")}];`,
        ].join("\n");
      }
      if (id.startsWith(resolved(projectPrefix))) {
        const loaded = await loadStacks();
        const [label = "", key = ""] = id
          .slice(resolved(projectPrefix).length)
          .split("/");
        return jsonModule(await loaded.project(label, key));
      }
      return null;
    },
    name: "vibestart",
    resolveId: (id) => {
      if (id === moduleId || id.startsWith(projectPrefix)) {
        return resolved(id);
      }
      return null;
    },
  };
};
