import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { goldenPaths, goldenRoot, goldens } from "#/goldens.ts";
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

      for (const stale of created
        ? []
        : goldenPaths(golden).filter(
            (file) =>
              !generated.has(file) &&
              !setupWrites.some((glob) => path.matchesGlob(file, glob))
          )) {
        rmSync(`${root}${stale}`);
        print(`${golden}: deleted ${stale}`);
      }

      for (const file of generation.files) {
        mkdirSync(path.dirname(`${root}${file.path}`), { recursive: true });
        writeFileSync(`${root}${file.path}`, file.content);
      }

      if (created) {
        for (const command of generation.setup) {
          print(`${golden}: ${command.run}`);
          // A golden sits inside this repository, so its `vp config` must not take over the repository's hooks.
          execSync(command.run, {
            cwd: root,
            env: { ...projectEnv, VP_GIT_HOOKS: "0" },
            stdio: "inherit",
          });
        }
      }
    })
  );
};
