import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { z } from "zod";

import { verificationSchema } from "@vibestart/core";

const repository = "VinkyDev/vibestart";
const runSchema = z.object({
  id: z.number(),
  event: z.string(),
  path: z.string(),
  head_repository: z.object({ full_name: z.string() }).nullable(),
});
const artifactSchema = z.object({
  name: z.string(),
  expired: z.boolean(),
  archive_download_url: z.url(),
  digest: z.string().nullable(),
  workflow_run: z
    .object({
      id: z.number(),
      repository_id: z.number(),
      head_repository_id: z.number(),
    })
    .nullable(),
});

export const prepareVerification = async () => {
  if (process.env.WORKERS_CI !== "1") {
    return;
  }
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (token === undefined || token === "") {
    throw new Error(
      "Cloudflare builds need GH_TOKEN with repository Actions read permission."
    );
  }
  const root = path.resolve(import.meta.dirname, "../../..");
  const destination = path.join(
    root,
    "packages/integrations/verification/current.json"
  );
  rmSync(destination, { force: true });
  const request = async (url: string) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(
        `Verification artifact request failed (${response.status}).`
      );
    }
    return response;
  };
  const listing = await request(
    `https://api.github.com/repos/${repository}/actions/artifacts?name=verification-web&per_page=10`
  );
  const { artifacts } = z
    .object({ artifacts: z.array(artifactSchema) })
    .parse(await listing.json());
  const candidates = artifacts
    .flatMap((artifact) => {
      const run = artifact.workflow_run;
      if (
        artifact.name !== "verification-web" ||
        artifact.expired ||
        run === null ||
        run.repository_id !== run.head_repository_id
      ) {
        return [];
      }
      return [{ artifact, id: run.id }];
    })
    .slice(0, 3);
  const sources = await Promise.all(
    candidates.map(async ({ artifact, id }) => {
      const response = await request(
        `https://api.github.com/repos/${repository}/actions/runs/${id}`
      );
      return { artifact, run: runSchema.parse(await response.json()) };
    })
  );
  const source = sources.find(
    ({ run }) =>
      run.path === ".github/workflows/ci.yml" &&
      run.head_repository?.full_name === repository &&
      ["push", "pull_request", "workflow_dispatch", "schedule"].includes(
        run.event
      )
  );
  if (source === undefined) {
    throw new Error(
      "No complete verification-web artifact is available; retry after repository CI passes."
    );
  }
  const { artifact, run } = source;
  const download = await request(artifact.archive_download_url);
  const archive = Buffer.from(await download.arrayBuffer());
  const digest = `sha256:${createHash("sha256").update(archive).digest("hex")}`;
  if (artifact.digest !== null && artifact.digest !== digest) {
    throw new Error("Verification artifact digest mismatch.");
  }
  const zip = path.join(root, ".verification", "web.zip");
  mkdirSync(path.dirname(zip), { recursive: true });
  writeFileSync(zip, archive);
  const records = verificationSchema.parse(
    JSON.parse(
      execFileSync("unzip", ["-p", zip, "current.json"], {
        encoding: "utf-8",
        maxBuffer: 4 * 1024 * 1024,
      })
    )
  );
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, JSON.stringify(records));
  rmSync(zip);
  process.stdout.write(`Embedded verification from CI run ${run.id}.\n`);
};
