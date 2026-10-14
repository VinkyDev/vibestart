import { createHash } from "node:crypto";

import { combinations } from "es-toolkit/array";
import { z } from "zod";

import type { GeneratedFile, Generation, Stack } from "@vibestart/core";

import { registry } from "#/registry.ts";

/**
 * A facet is one thing `vp run ready` exercises in a stack's output. A pass vouches for every facet of the output
 * it ran in, so a stack whose facets all have passes is covered without a run of its own. Facets are strings, and
 * two stacks share a facet exactly when they share what it names.
 */
export type Facets = ReadonlySet<string>;

const digest = (content: string) =>
  createHash("sha256").update(content).digest("hex");

// `ready` reads no documentation and no Docker file (deployment.test.ts), and the blueprint restates the choices.
const read = (file: GeneratedFile) =>
  !file.path.endsWith(".md") &&
  file.owner !== "docker" &&
  file.path !== "vibestart.jsonc";

// The catalog lists exactly the dependencies of the stack, so the file as a whole is new in every stack.
const listedOneByLine = new Set(["pnpm-workspace.yaml"]);

const fileFacets = (file: GeneratedFile) =>
  listedOneByLine.has(file.path)
    ? file.content
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => `line ${file.path} ${line}`)
    : [`file ${file.path} ${digest(file.content)}`];

// Docker changes only its own files, so a deployment is not a choice `ready` sees.
const choiceKinds = registry.kinds
  .map((kind) => kind.id)
  .filter((kind) => kind !== "deployment");

/** Every `size` of the stack's choices made together, an empty kind included as `none`. */
const choiceFacets = (stack: Stack, size: number) =>
  combinations(
    choiceKinds.map((kind) => `${kind}=${stack[kind] ?? "none"}`),
    size
  ).map((choices) => `choices ${choices.join(" ")}`);

/**
 * Under pnpm, every file `ready` reads, the setup, and every three choices together: a file can break only in the
 * context of the others, and each of its contexts differs in the choices that render them.
 */
export const pnpmFacets = (stack: Stack, generation: Generation): Facets =>
  new Set([
    ...generation.files.filter(read).flatMap(fileFacets),
    `setup ${digest(JSON.stringify(generation.setup))}`,
    ...choiceFacets(stack, 3),
  ]);

const manifestSchema = z.looseObject({
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
  overrides: z.record(z.string(), z.string()).optional(),
  peerDependencies: z.record(z.string(), z.string()).optional(),
  trustedDependencies: z.array(z.string()).optional(),
  workspaces: z
    .object({ catalog: z.record(z.string(), z.string()).optional() })
    .optional(),
});

const manifestFacets = (file: GeneratedFile) => {
  const manifest = manifestSchema.parse(JSON.parse(file.content));

  return [
    ...[
      manifest.dependencies,
      manifest.devDependencies,
      manifest.peerDependencies,
    ].flatMap((group) => Object.keys(group ?? {}).map((name) => `dep ${name}`)),
    ...Object.entries(manifest.workspaces?.catalog ?? {}).map(
      ([name, range]) => `catalog ${name} ${range}`
    ),
    ...Object.entries(manifest.overrides ?? {}).map(
      ([name, range]) => `override ${name} ${range}`
    ),
    ...(manifest.trustedDependencies ?? []).map((name) => `trusted ${name}`),
  ];
};

/**
 * Under Bun the sources are pnpm's (bun-sources.test.ts), so a Bun run checks that dependencies install, run their
 * trusted scripts, and resolve under Bun: every dependency, catalog range, override, and trusted package, and every
 * two choices together for the dependencies they bring in beside each other.
 */
export const bunFacets = (stack: Stack, generation: Generation): Facets =>
  new Set([
    ...generation.files
      .filter((file) => file.path.endsWith("package.json"))
      .flatMap(manifestFacets),
    ...choiceFacets(stack, 2),
  ]);

/** A stack that a run can vouch for, by the label its record carries. */
export interface Candidate {
  readonly label: string;
  readonly facets: Facets;
}

const gainOf = (candidate: Candidate, pending: ReadonlySet<string>) => {
  let gain = 0;

  for (const facet of candidate.facets) {
    if (pending.has(facet)) {
      gain += 1;
    }
  }

  return gain;
};

/**
 * The candidates to run so that every facet of every candidate has a pass: the `pinned` ones that have none, then,
 * greedily, the one that covers the most facets still uncovered, the first label on a tie. `passed` labels already
 * have a pass, so a change re-runs only what covers the facets it changed.
 */
export const coverPlan = (
  candidates: readonly Candidate[],
  passed: ReadonlySet<string>,
  pinned: ReadonlySet<string> = new Set()
) => {
  const ordered = candidates.toSorted((a, b) => a.label.localeCompare(b.label));
  const pending = new Set(ordered.flatMap(({ facets }) => [...facets]));

  const take = (candidate: Candidate) => {
    for (const facet of candidate.facets) {
      pending.delete(facet);
    }
  };

  for (const candidate of ordered.filter(({ label }) => passed.has(label))) {
    take(candidate);
  }

  const chosen = ordered.filter(
    ({ label }) => pinned.has(label) && !passed.has(label)
  );

  for (const candidate of chosen) {
    take(candidate);
  }

  while (pending.size > 0) {
    let best: Candidate | undefined;
    let bestGain = 0;

    for (const candidate of ordered) {
      const gain = gainOf(candidate, pending);

      if (gain > bestGain) {
        best = candidate;
        bestGain = gain;
      }
    }

    // Each pending facet belongs to some candidate, so one always gains.
    if (best === undefined) {
      throw new Error("A pending facet belongs to no candidate");
    }

    chosen.push(best);
    take(best);
  }

  return chosen.map(({ label }) => label);
};

/**
 * For each candidate whose facets all have a pass, the passed candidate it shares the most facets with, the first
 * label on a tie: itself when it passed.
 */
export const coveredBy = (
  candidates: readonly Candidate[],
  passed: ReadonlySet<string>
) => {
  const witnesses = candidates
    .filter(({ label }) => passed.has(label))
    .toSorted((a, b) => a.label.localeCompare(b.label));

  const vouched = new Set(witnesses.flatMap(({ facets }) => [...facets]));
  const result = new Map<string, string>();

  for (const candidate of candidates) {
    if (passed.has(candidate.label)) {
      result.set(candidate.label, candidate.label);
      continue;
    }

    if (![...candidate.facets].every((facet) => vouched.has(facet))) {
      continue;
    }

    let best: Candidate | undefined;
    let bestShared = -1;

    for (const witness of witnesses) {
      const shared = gainOf(witness, candidate.facets);

      if (shared > bestShared) {
        best = witness;
        bestShared = shared;
      }
    }

    if (best !== undefined) {
      result.set(candidate.label, best.label);
    }
  }

  return result;
};
