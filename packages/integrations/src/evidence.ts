import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { z } from "zod";

const gh = (args: readonly string[]) =>
  execFileSync("gh", args, { encoding: "utf-8" });

const repositorySchema = z.object({ full_name: z.string() }).nullable();

const headSchema = z.object({ ref: z.string(), repo: repositorySchema });

const eventSchema = z.object({ pull_request: z.object({ head: headSchema }) });

const pullsSchema = z.array(
  z.object({ head: headSchema, merge_commit_sha: z.string().nullable() })
);

const runsSchema = z.object({
  workflow_runs: z.array(
    z.object({ head_repository: repositorySchema, id: z.number() })
  ),
});

const githubSchema = z.object({
  GITHUB_EVENT_NAME: z.string(),
  GITHUB_EVENT_PATH: z.string(),
  GITHUB_REPOSITORY: z.string(),
  GITHUB_RUN_ID: z.string(),
  GITHUB_SHA: z.string(),
});

type Github = z.infer<typeof githubSchema>;

/**
 * The pull request branch whose runs vouch for this one: on a pull request its own branch, on `main` the branch
 * merged as this commit. A fork controls the workflow its pull request runs, so its results vouch for nothing.
 */
const evidenceBranch = (github: Github) => {
  const heads =
    github.GITHUB_EVENT_NAME === "pull_request"
      ? [
          eventSchema.parse(
            JSON.parse(readFileSync(github.GITHUB_EVENT_PATH, "utf-8"))
          ).pull_request.head,
        ]
      : pullsSchema
          .parse(
            JSON.parse(
              gh([
                "api",
                `repos/${github.GITHUB_REPOSITORY}/commits/${github.GITHUB_SHA}/pulls`,
              ])
            )
          )
          .filter((pull) => pull.merge_commit_sha === github.GITHUB_SHA)
          .map((pull) => pull.head);
  return heads.find((head) => head.repo?.full_name === github.GITHUB_REPOSITORY)
    ?.ref;
};

// Each run re-uploads the results it reused, so the last few runs of a branch carry all of its evidence.
const runsPerBranch = 5;

/**
 * Downloads the `results-*` artifacts of the latest CI runs of this run's pull request branch into a new directory.
 * A run whose artifacts are gone leaves nothing; its tasks run again.
 */
export const downloadEvidence = (log: (line: string) => void) => {
  const dir = mkdtempSync(path.join(tmpdir(), "vibestart-evidence-"));
  const github = githubSchema.parse(process.env);
  const branch = evidenceBranch(github);
  if (branch === undefined) {
    log("No pull request branch of this repository vouches for this run");
    return dir;
  }
  const runs = runsSchema
    .parse(
      JSON.parse(
        gh([
          "api",
          `repos/${github.GITHUB_REPOSITORY}/actions/workflows/ci.yml/runs?event=pull_request&per_page=${runsPerBranch}&branch=${encodeURIComponent(branch)}`,
        ])
      )
    )
    .workflow_runs.filter(
      (run) =>
        run.head_repository?.full_name === github.GITHUB_REPOSITORY &&
        String(run.id) !== github.GITHUB_RUN_ID
    );
  for (const run of runs) {
    const target = path.join(dir, String(run.id));
    try {
      gh([
        "run",
        "download",
        String(run.id),
        "--repo",
        github.GITHUB_REPOSITORY,
        "--pattern",
        "results-*",
        "--dir",
        target,
      ]);
      log(`Downloaded the results of ${branch} run ${run.id}`);
    } catch {
      rmSync(target, { force: true, recursive: true });
      log(`${branch} run ${run.id} left no results`);
    }
  }
  return dir;
};
