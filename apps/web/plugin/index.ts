import path from "node:path";

import { limitAsync } from "es-toolkit/promise";
import type { Plugin } from "vite-plus";
import { runnerImport } from "vite-plus";

import type { Project } from "../src/lib/project.ts";
import type * as Stacks from "./stacks.ts";
import { prepareVerification } from "./verification.ts";

const moduleId = "virtual:vibestart";
const projectPrefix = `${moduleId}/project/`;
const resolved = (id: string) => `\0${id}`;

/** A module whose default export is one project; `JSON.parse` of a string literal parses faster than an object literal. */
const jsonModule = (project: Project) =>
  `export default JSON.parse(${JSON.stringify(JSON.stringify(project))});`;

/**
 * Project previews use the native formatter at build time; bound concurrent generation for hosted builds.
 */
export const vibestart = (): Plugin => {
  let stacks: Promise<typeof Stacks> | undefined;
  const loadStacks = async () => {
    stacks ??= (async () => {
      await prepareVerification();
      const imported = await runnerImport<typeof Stacks>("/plugin/stacks.ts", {
        oxc: { exclude: ["**/templates/**"] },
        root: path.dirname(import.meta.dirname),
      });
      return imported.module;
    })();
    return await stacks;
  };

  let projectCount = 0;
  const loadProject = limitAsync(async (label: string, key: string) => {
    const loaded = await loadStacks();
    projectCount += 1;
    return jsonModule(await loaded.project(label, key));
  }, 2);

  return {
    buildEnd: () => {
      process.stdout.write(
        `Generated ${projectCount} project previews with at most two concurrent generators.\n`
      );
    },
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
        const [label = "", key = ""] = id
          .slice(resolved(projectPrefix).length)
          .split("/");
        return await loadProject(label, key);
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
