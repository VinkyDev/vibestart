import { readFileSync } from "node:fs";

import { describe, expect, it } from "vite-plus/test";

import { repoRoot } from "#/repo.ts";

import { bestAgentsMd } from "../best-agents-md.ts";

const repoAgents = readFileSync(`${repoRoot}AGENTS.md`, "utf-8");

describe("the repository's AGENTS.md", () => {
  it("carries the best-agents-md standard once, in its markers", () => {
    const start = repoAgents.indexOf(bestAgentsMd);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(repoAgents.indexOf(bestAgentsMd, start + 1)).toBe(-1);
    expect(
      repoAgents.match(/<!-- best-agents-md:(?:start|end) -->/gu)
    ).toStrictEqual([
      "<!-- best-agents-md:start -->",
      "<!-- best-agents-md:end -->",
    ]);
  });
});
