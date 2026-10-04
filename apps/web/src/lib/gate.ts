import { sumBy } from "es-toolkit/math";
import { z } from "zod";

import type { Project } from "#/lib/project.ts";

export interface Gate {
  readonly commands: readonly string[];
  readonly files: number;
  readonly tests: number;
  readonly journeys: number;
}

const testCase = /^\s*(?:it|test)(?:\.each)?\(/gmu;

const casesIn = (project: Project, suffix: string) =>
  sumBy(
    project.files.filter((file) => file.path.endsWith(suffix)),
    (file) => file.content.match(testCase)?.length ?? 0
  );

const manifestSchema = z.object({
  scripts: z.object({ ready: z.string().optional() }).optional(),
});

const readyCommands = (project: Project): readonly string[] => {
  const manifest = project.files.find((file) => file.path === "package.json");
  if (manifest === undefined) {
    return [];
  }
  const { scripts } = manifestSchema.parse(JSON.parse(manifest.content));
  return scripts?.ready?.split("&&").map((command) => command.trim()) ?? [];
};

export const gateOf = (project: Project): Gate => ({
  commands: [
    ...project.setup.map((command) => command.run),
    ...readyCommands(project),
  ],
  files: project.files.length,
  journeys: casesIn(project, ".e2e.ts"),
  tests: casesIn(project, ".test.ts"),
});
