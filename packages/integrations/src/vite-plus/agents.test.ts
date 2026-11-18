import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { describe, expect, it } from "vite-plus/test";

import { repoRoot } from "#/repo.ts";

import bestAgentsStandard from "../best-agents-md.md?raw";
import { bestAgentsMd } from "../best-agents-md.ts";

const require = createRequire(import.meta.url);

const installed = readFileSync(
  require.resolve("best-agents-md/AGENTS.md"),
  "utf-8"
)
  .replaceAll("\r\n", "\n")
  .trimEnd();

const repoAgents = readFileSync(`${repoRoot}AGENTS.md`, "utf-8");

describe("the best-agents-md standard", () => {
  it("is the pinned release, once, in this repository's markers", () => {
    expect(bestAgentsStandard.replaceAll("\r\n", "\n").trimEnd()).toBe(
      installed
    );

    const agents = repoAgents.replaceAll("\r\n", "\n");
    expect(agents.split(installed).length - 1).toBe(1);

    const start = agents.indexOf(bestAgentsMd);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(agents.indexOf(bestAgentsMd, start + 1)).toBe(-1);
    expect(
      agents.match(/<!-- best-agents-md:(?:start|end) -->/gu)
    ).toStrictEqual([
      "<!-- best-agents-md:start -->",
      "<!-- best-agents-md:end -->",
    ]);
  });
});
