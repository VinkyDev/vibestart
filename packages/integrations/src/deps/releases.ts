import { retry } from "es-toolkit/function";
import { limitAsync } from "es-toolkit/promise";
import { z } from "zod";

import type { Packument, Releases } from "#/deps/targets.ts";

const packumentSchema = z
  .object({
    "dist-tags": z.record(z.string(), z.string()),
    versions: z.record(
      z.string(),
      z
        .object({
          dependencies: z.record(z.string(), z.string()).optional(),
          deprecated: z.union([z.string(), z.boolean()]).optional(),
        })
        // Some old publishes mark a version `true` or `false` rather than giving a notice.
        .transform(({ dependencies, deprecated }) =>
          deprecated === false
            ? { dependencies }
            : {
                dependencies,
                deprecated: deprecated === true ? "deprecated" : deprecated,
              }
        )
    ),
  })
  .transform(({ "dist-tags": distTags, versions }): Packument => ({
    distTags,
    versions,
  }));

const nodeIndexSchema = z.array(
  z.object({
    lts: z.union([z.string(), z.literal(false)]),
    version: z.string(),
  })
);

const registry = (
  process.env.npm_config_registry ?? "https://registry.npmjs.org/"
).replace(/\/?$/u, "/");
const nodeDist = process.env.NODEJS_ORG_MIRROR ?? "https://nodejs.org/dist";

const getJson = async (
  url: string,
  headers: Readonly<Record<string, string>> = {}
) =>
  await retry(
    async () => {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`GET ${url}: ${response.status}`);
      }
      const body: unknown = await response.json();
      return body;
    },
    { delay: 1000, retries: 3 }
  );

const fetchPackument = limitAsync(
  async (name: string) =>
    packumentSchema.parse(
      await getJson(`${registry}${name.replace("/", "%2f")}`, {
        // The abbreviated metadata pnpm installs from: dist-tags, and each version's dependencies.
        accept: "application/vnd.npm.install-v1+json",
      })
    ),
  8
);

export const fetchReleases = async (
  names: readonly string[]
): Promise<Releases> => {
  const [packuments, nodeIndex] = await Promise.all([
    Promise.all(
      names.map(async (name) => [name, await fetchPackument(name)] as const)
    ),
    getJson(`${nodeDist}/index.json`),
  ]);
  const byName = new Map(packuments);
  // The index lists releases newest first.
  const lts = nodeIndexSchema
    .parse(nodeIndex)
    .find((release) => release.lts !== false);
  if (lts === undefined) {
    throw new Error(`${nodeDist}/index.json lists no LTS release`);
  }
  return {
    nodeLts: lts.version.replace(/^v/u, ""),
    packument: (name) => {
      const packument = byName.get(name);
      if (packument === undefined) {
        throw new Error(`${name} was not fetched`);
      }
      return packument;
    },
  };
};
