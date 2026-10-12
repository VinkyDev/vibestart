import { readFileSync } from "node:fs";

import { describe, expect, it } from "vite-plus/test";

import { repoRoot } from "#/repo.ts";

import agentsTests from "../testing/agents-tests-intro.md?raw";
import agentsCode from "./agents-code.md?raw";
import agentsDone from "./agents-done.md?raw";

const repoAgents = readFileSync(`${repoRoot}AGENTS.md`, "utf-8");

describe("the repository's AGENTS.md", () => {
  it.each([
    ["agents-code.md", agentsCode],
    ["agents-tests-intro.md", agentsTests],
    ["agents-done.md", agentsDone],
  ])("carries the text of %s", (_file, text) => {
    expect(repoAgents).toContain(text.trimEnd());
  });
});
