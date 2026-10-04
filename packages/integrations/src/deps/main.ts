import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import { pinFiles, pinsOf } from "#/deps/pins.ts";
import { fetchReleases } from "#/deps/releases.ts";
import type { Target } from "#/deps/targets.ts";
import { isBehind, targetsOf } from "#/deps/targets.ts";
import { repoRoot } from "#/repo.ts";

const usage = `Usage: vp run deps [update] [pattern] [--json] [--skip-stack-verification]

  (no command)       compare each pinned version with the registry and list the pins behind,
                     exiting 1 when one is (--json prints every pin, behind or not)
  update [pattern]   move the pins whose name matches to their targets, then refresh and verify
                     what they reach: vp install, the golden projects and their lockfiles, the
                     stack snapshots, vp run stacks verify, and vp run ready

  --skip-stack-verification  omit service/browser stack verification; records stay unchanged

Pins live in pnpm-workspace.yaml (this repository), packages/integrations/src/catalog.ts
(generated projects), and package.json (the Node.js and pnpm this repository runs).`;

const print = (line: string) => {
  process.stdout.write(`${line}\n`);
};

const table = (rows: readonly (readonly string[])[]) => {
  const widths: number[] = [];
  for (const row of rows) {
    for (const [index, cell] of row.entries()) {
      widths[index] = Math.max(widths[index] ?? 0, cell.length);
    }
  }
  for (const row of rows) {
    print(
      row
        .map((cell, index) => cell.padEnd(widths[index] ?? 0))
        .join("  ")
        .trimEnd()
    );
  }
};

const report = (targets: readonly Target[]) => {
  const behind = targets.filter(isBehind);
  if (behind.length > 0) {
    table([
      ["package", "current", "target", "bump", "rule", "pinned in"],
      ...behind.map((target) => [
        target.name,
        [...new Set(target.ranges.values())].join(" | "),
        target.target,
        target.bump ?? "files differ",
        target.rule,
        [...target.ranges.keys()].map((file) => path.basename(file)).join(", "),
      ]),
    ]);
    print("");
  }
  for (const { current, deprecated, name } of targets) {
    if (deprecated !== undefined) {
      print(`${name}@${current} is deprecated: ${deprecated}`);
    }
  }
  print(`${behind.length} of ${targets.length} pins behind`);
};

const goldenProjects = () =>
  readdirSync(`${repoRoot}golden`, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `golden/${entry.name}`);

interface Step {
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env?: Readonly<Record<string, string>>;
}

const refresh = (skipStackVerification: boolean): readonly Step[] => [
  { args: ["install", "--no-frozen-lockfile"], cwd: "" },
  { args: ["run", "stacks", "goldens"], cwd: "" },
  // A golden sits inside this repository, so its `vp config` must not take over the repository's hooks.
  ...goldenProjects().map((cwd) => ({
    args: ["install", "--no-frozen-lockfile"],
    cwd,
    env: { VP_GIT_HOOKS: "0" },
  })),
  // pnpm may add exact-version release-age exceptions during install. Goldens compare pure
  // generator output; render it again while retaining the freshly resolved setup-owned lockfiles.
  { args: ["run", "stacks", "goldens"], cwd: "" },
  {
    args: [
      "test",
      "--project",
      "@vibestart/integrations",
      // `--update` takes an optional mode, so a bare one would read the file after it as the mode.
      "--update=all",
      "src/snapshot.test.ts",
    ],
    cwd: "",
  },
  ...(skipStackVerification
    ? []
    : [{ args: ["run", "stacks", "verify"], cwd: "" }]),
  { args: ["run", "ready"], cwd: "" },
];

const update = (targets: readonly Target[], skipStackVerification: boolean) => {
  const moving = targets.filter(isBehind);
  if (moving.length === 0) {
    print("Every pin is at its target");
    return 0;
  }
  const ranges = new Map(moving.map((target) => [target.name, target.target]));
  for (const file of pinFiles()) {
    file.write(ranges);
  }
  for (const target of moving) {
    print(`${target.name}: ${target.current} → ${target.target}`);
  }
  for (const step of refresh(skipStackVerification)) {
    const command = ["vp", ...step.args].join(" ");
    print(`\n$ ${command}${step.cwd === "" ? "" : `  (in ${step.cwd})`}`);
    try {
      execFileSync("vp", step.args, {
        cwd: `${repoRoot}${step.cwd}`,
        env: { ...process.env, ...step.env },
        stdio: "inherit",
      });
    } catch {
      print(
        `\n${command} failed. The moved pins stay in the working tree to fix or revert.`
      );
      return 1;
    }
  }
  print(
    `\nMoved ${moving.length} pins. ${skipStackVerification ? "Repository checks passed; stack verification was skipped and verification.json was not refreshed." : "All repository and stack checks passed."}`
  );
  return 0;
};

export const main = async (args: readonly string[]) => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: [...args],
    options: {
      json: { default: false, type: "boolean" },
      "skip-stack-verification": { default: false, type: "boolean" },
    },
  });
  const [command, pattern] = positionals;
  if (command !== undefined && command !== "update") {
    print(usage);
    return 1;
  }
  const pins = pinsOf(pinFiles());
  const releases = await fetchReleases(
    pins
      .filter(
        ({ name, ranges }) =>
          name !== "node" &&
          ![...ranges.values()].some((range) => range.startsWith("npm:"))
      )
      .map(({ name }) => name)
  );
  const matches =
    pattern === undefined
      ? () => true
      : (name: string) => new RegExp(pattern, "u").test(name);
  const targets = targetsOf(pins, releases, matches);
  if (command === "update") {
    return update(targets, values["skip-stack-verification"]);
  }
  if (values.json) {
    print(
      JSON.stringify(
        targets.map((target) => ({
          ...target,
          behind: isBehind(target),
          ranges: Object.fromEntries(target.ranges),
        })),
        null,
        2
      )
    );
  } else {
    report(targets);
  }
  return targets.some(isBehind) ? 1 : 0;
};
