import { describe, expect, it } from "vite-plus/test";

import { compose } from "@vibestart/core";

import type { Candidate } from "#/coverage.ts";
import { coverPlan, coveredBy, pnpmFacets } from "#/coverage.ts";
import { registry } from "#/registry.ts";
import { verifiedGeneration } from "#/verification.ts";

const candidate = (label: string, facets: readonly string[]): Candidate => ({
  facets: new Set(facets),
  label,
});

// Two stacks that share a template, and a third whose only new facet is one of the first's.
const a = candidate("a", ["shared", "a-only"]);
const b = candidate("b", ["shared", "b-only"]);
const wide = candidate("wide", ["shared", "a-only", "b-only", "wide-only"]);

describe(coverPlan, () => {
  it("runs the fewest stacks whose facets include every candidate's", () => {
    expect(coverPlan([a, b, wide], new Set())).toStrictEqual(["wide"]);
  });

  it("runs nothing when the passes already cover every facet", () => {
    expect(coverPlan([a, b, wide], new Set(["wide"]))).toStrictEqual([]);
  });

  it("after a change, runs only what covers the facets no pass has", () => {
    const changed = candidate("b", ["shared", "b-changed"]);
    expect(coverPlan([a, changed], new Set(["a"]))).toStrictEqual(["b"]);
  });

  it("runs a pinned stack without a pass even when others cover it", () => {
    expect(coverPlan([a, b, wide], new Set(), new Set(["a"]))).toStrictEqual([
      "a",
      "wide",
    ]);
  });

  it("breaks a tie on the first label, so a plan does not depend on input order", () => {
    expect(coverPlan([b, a], new Set())).toStrictEqual(["a", "b"]);
  });
});

describe(coveredBy, () => {
  it("names the pass a stack shares most with, and itself when it passed", () => {
    expect(coveredBy([a, b, wide], new Set(["a", "wide"]))).toStrictEqual(
      new Map([
        ["a", "a"],
        ["b", "wide"],
        ["wide", "wide"],
      ])
    );
  });

  it("leaves out a stack with a facet no pass has", () => {
    expect(coveredBy([a, b], new Set(["a"]))).toStrictEqual(
      new Map([["a", "a"]])
    );
  });
});

describe(pnpmFacets, () => {
  it("leaves out what `vp run ready` does not read: docs, Docker files, and the blueprint", async () => {
    const stack = compose(registry, { deployment: "docker" });
    const facets = [...pnpmFacets(stack, await verifiedGeneration(stack))];
    const files = facets.filter((facet) => facet.startsWith("file "));
    expect(
      files.some((facet) => facet.startsWith("file package.json "))
    ).toBeTruthy();
    expect(
      files.filter((facet) =>
        /^file (?:\S+\.md|Dockerfile|docker-compose\.yml|\.dockerignore|vibestart\.jsonc) /u.test(
          facet
        )
      )
    ).toStrictEqual([]);
  });

  it("takes every three choices together, Docker aside", async () => {
    const stack = compose(registry, { deployment: "docker" });
    const choices = [
      ...pnpmFacets(stack, await verifiedGeneration(stack)),
    ].filter((facet) => facet.startsWith("choices "));
    const kinds = registry.kinds.length - 1;
    expect(choices).toHaveLength((kinds * (kinds - 1) * (kinds - 2)) / 6);
    expect(choices.some((facet) => facet.includes("deployment="))).toBeFalsy();
  });
});
