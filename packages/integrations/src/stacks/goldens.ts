import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  goldenPaths,
  goldenRoot,
  goldens,
  isGitIgnoredSetupWrite,
  trackedSetupWrites,
} from "#/goldens.ts";
import { repoRoot } from "#/repo.ts";
import { verifiedGeneration } from "#/verification.ts";

import { print, projectEnv } from "./project.ts";

/** A new golden runs its setup; a golden no longer listed is deleted. */
export const syncGoldens = async () => {
  for (const stale of readdirSync(`${repoRoot}golden`).filter(
    (golden) => !Object.hasOwn(goldens, golden)
  )) {
    rmSync(goldenRoot(stale), { force: true, recursive: true });
    print(`deleted golden/${stale}`);
  }

  await Promise.all(
    Object.entries(goldens).map(async ([golden, stack]) => {
      const generation = await verifiedGeneration(stack);
      const root = goldenRoot(golden);
      const created = !existsSync(root);
      const setupWrites = generation.setup.flatMap((command) => command.writes);
      const generated = new Set(generation.files.map((file) => file.path));

      const staleFiles = created
        ? []
        : goldenPaths(golden).filter(
            (file) =>
              !generated.has(file) &&
              !setupWrites.some((glob) => path.matchesGlob(file, glob))
          );

      for (const stale of staleFiles) {
        rmSync(`${root}${stale}`);
        print(`${golden}: deleted ${stale}`);
      }

      const changedInputs = new Set(staleFiles);

      for (const file of generation.files) {
        const target = `${root}${file.path}`;

        if (
          !existsSync(target) ||
          readFileSync(target, "utf-8") !== file.content
        ) {
          changedInputs.add(file.path);
          mkdirSync(path.dirname(target), { recursive: true });
          writeFileSync(target, file.content);
        }
      }

      if (
        [...changedInputs].some((file) =>
          path.matchesGlob(file, "apps/web/src/routes/**")
        )
      ) {
        rmSync(`${root}apps/web/src/routeTree.gen.ts`, { force: true });
      }

      const gitignore =
        generation.files.find((file) => file.path === ".gitignore")?.content ??
        "";

      const paths = goldenPaths(golden);

      const missingTracked = trackedSetupWrites(generation).some(
        (glob) => !paths.some((file) => path.matchesGlob(file, glob))
      );

      let ranSetup = false;

      if (created || missingTracked) {
        for (const command of generation.setup) {
          const shouldRun =
            created ||
            (command.stage === "install" &&
              !existsSync(`${root}node_modules`)) ||
            command.writes.some(
              (glob) =>
                isGitIgnoredSetupWrite(gitignore, glob) ||
                !paths.some((file) => path.matchesGlob(file, glob))
            );

          if (shouldRun) {
            ranSetup = true;
            print(`${golden}: ${command.run}`);
            // A golden sits inside this repository, so its `vp config` must not take over the repository's hooks.
            execSync(command.run, {
              cwd: root,
              env: { ...projectEnv, VP_GIT_HOOKS: "0" },
              stdio: "inherit",
            });
          }
        }
      }

      if (ranSetup) {
        execSync("vp fmt", {
          cwd: root,
          env: { ...projectEnv, VP_GIT_HOOKS: "0" },
          stdio: "inherit",
        });
      }

      for (const stale of goldenPaths(golden).filter(
        (file) =>
          !generated.has(file) &&
          !setupWrites.some((glob) => path.matchesGlob(file, glob))
      )) {
        rmSync(`${root}${stale}`);
        print(`${golden}: deleted ${stale}`);
      }
    })
  );
};
