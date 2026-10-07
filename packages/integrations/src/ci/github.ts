import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

import { z } from "zod";

const runSchema = z.object({
  id: z.number(),
  event: z.string(),
  head_branch: z.string(),
  head_sha: z.string(),
  head_repository: z.object({ full_name: z.string() }),
});

const api = <T>(endpoint: string, schema: z.ZodType<T>): T =>
  schema.parse(
    JSON.parse(
      execFileSync("gh", ["api", endpoint], {
        encoding: "utf-8",
        timeout: 60_000,
        maxBuffer: 16 * 1024 * 1024,
      })
    )
  );

export const restore = (root: string) => {
  const repository = process.env.GITHUB_REPOSITORY ?? "VinkyDev/vibestart";
  const history = path.join(root, "history");
  rmSync(history, { recursive: true, force: true });
  mkdirSync(history, { recursive: true });
  try {
    const { workflow_runs: runs } = api(
      `repos/${repository}/actions/workflows/ci.yml/runs?status=completed&per_page=30`,
      z.object({ workflow_runs: z.array(runSchema) })
    );
    for (const run of runs) {
      if (
        String(run.id) === process.env.GITHUB_RUN_ID ||
        run.head_repository.full_name !== repository
      ) {
        continue;
      }
      const main = run.event === "push" && run.head_branch === "main";
      const scheduled = run.event === "schedule" && run.head_branch === "main";
      const pulls =
        run.event === "pull_request"
          ? api(
              `repos/${repository}/commits/${run.head_sha}/pulls`,
              z.array(
                z.object({
                  head: z.object({
                    repo: z.object({ full_name: z.string() }).nullable(),
                  }),
                })
              )
            )
          : [];
      const sameRepositoryPull =
        pulls.length > 0 &&
        pulls.every((pull) => pull.head.repo?.full_name === repository);
      if (
        !main &&
        !scheduled &&
        !sameRepositoryPull &&
        run.event !== "workflow_dispatch"
      ) {
        continue;
      }
      const dir = path.join(history, String(run.id));
      try {
        execFileSync(
          "gh",
          [
            "run",
            "download",
            String(run.id),
            "--repo",
            repository,
            "--name",
            "verification",
            "--dir",
            dir,
          ],
          { stdio: "pipe", timeout: 120_000 }
        );
      } catch {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    process.stderr.write(
      `Evidence unavailable; missing tasks will run: ${String(error)}\n`
    );
  }
};
