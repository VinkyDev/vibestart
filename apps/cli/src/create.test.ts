import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { packageManagers } from "@vibestart/core";
import type * as Integrations from "@vibestart/integrations";

import { create } from "#/create.ts";
import type * as MaintenanceFiles from "#/maintenance/files.ts";
import type * as Project from "#/project.ts";
import { hasCommand, runStep } from "#/project.ts";
import { jsonUi } from "#/ui.ts";

vi.mock(import("#/project.ts"), async (importOriginal) => ({
  ...(await importOriginal()),
  hasCommand: vi.fn<typeof Project.hasCommand>(),
  runStep: vi.fn<typeof Project.runStep>(),
  writeFiles: vi.fn<typeof Project.writeFiles>(),
}));

vi.mock(import("#/maintenance/files.ts"), async (importOriginal) => ({
  ...(await importOriginal()),
  initializeBaseline: vi.fn<typeof MaintenanceFiles.initializeBaseline>(),
}));

vi.mock(import("@vibestart/integrations"), async (importOriginal) => ({
  ...(await importOriginal()),
  materializeEnvFromExamples:
    vi.fn<typeof Integrations.materializeEnvFromExamples>(),
  verificationOf: vi.fn<typeof Integrations.verificationOf>(),
}));

const cases = packageManagers.flatMap((packageManager) =>
  [true, false].map((globalVitePlus) => ({ globalVitePlus, packageManager }))
);

describe("project installation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runStep).mockImplementation(
      async (_ui, _cwd, run) =>
        await Promise.resolve({
          run,
          seconds: 0,
        })
    );
  });

  it.each(cases)(
    "$packageManager installs once with global Vite+ = $globalVitePlus, then runs database setup",
    async ({ globalVitePlus, packageManager }) => {
      vi.mocked(hasCommand).mockImplementation(
        async (command) =>
          await Promise.resolve(command !== "vp" || globalVitePlus)
      );
      const result = await create(
        {
          addons: [],
          check: true,
          choices: {
            api: "openapi",
            auth: null,
            backend: "hono",
            database: "sqlite",
            framework: null,
            runtime: "node",
          },
          directory: path.join(import.meta.dirname, "installation-fixture"),
          dryRun: false,
          git: false,
          install: true,
          interactive: false,
          json: true,
          list: false,
          packageManager,
          recipe: undefined,
        },
        jsonUi,
        "test"
      );
      const commands = result.steps.map(({ run }) => run);
      const installs = commands.filter(
        (run) =>
          run === "vp install" ||
          run === "bun install" ||
          run.startsWith("npx --yes pnpm@")
      );
      expect(installs).toHaveLength(1);
      const expected = globalVitePlus
        ? /^vp install$/u
        : new RegExp(
            packageManager === "bun" ? "^bun install$" : "^npx --yes pnpm@",
            "u"
          );
      expect(installs[0]).toMatch(expected);
      expect(commands).toContain("vp run db:generate --name init");
      expect(commands.slice(-2)).toStrictEqual(["vp fmt", "vp check"]);
    }
  );
});
