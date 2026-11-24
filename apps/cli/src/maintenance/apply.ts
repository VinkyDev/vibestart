import { execa } from "execa";

import type { PackageManager } from "@vibestart/core";
import { toolchainVersions } from "@vibestart/integrations";

import { modeOf, readText, writeText } from "#/maintenance/files.ts";
import { MaintenanceError } from "#/maintenance/model.ts";
import type { Plan } from "#/maintenance/plan.ts";
import { hasCommand } from "#/project.ts";

export const undoHint =
  "git diff shows every change; git restore . && git clean -fd undoes them.";

/** Git is the record of a write: starting clean lets `git diff` show exactly what it changed, and undo it. */
export const assertCleanWorktree = async (cwd: string) => {
  const status = await execa("git", ["status", "--porcelain", "--", "."], {
    cwd,
    reject: false,
  });

  if (status.failed) {
    throw new MaintenanceError(
      "Writes need the project in a Git repository, so the change can be reviewed and undone. Run git init and commit the project first."
    );
  }

  if (status.stdout.trim() !== "") {
    throw new MaintenanceError(
      "Commit or stash your changes first. A write starts from a clean Git worktree, so git diff shows exactly what it changed."
    );
  }
};

export const writePlan = (cwd: string, plan: Plan) => {
  for (const change of plan.changes) {
    if (readText(cwd, change.path) !== change.before) {
      throw new MaintenanceError(`Changed since planning: ${change.path}`);
    }
  }

  try {
    for (const change of plan.changes) {
      writeText(cwd, change.path, change.after, modeOf(cwd, change.path));
    }
  } catch (error) {
    throw new MaintenanceError(
      `Writing stopped partway: ${error instanceof Error ? error.message : String(error)}\n${undoHint}`
    );
  }
};

type Command = readonly [string, ...string[]];

/** Default validation: static checks, Knip when selected, and the unit test project when present. */
export const checksOf = (cwd: string, plan: Plan, fullCheck: boolean) => {
  if (fullCheck) {
    return [["run", "ready"]];
  }

  const steps = [["check"]];

  if (plan.target.blueprint.addons.includes("knip")) {
    steps.push(["run", "knip"]);
  }

  if (/name:\s*["']unit["']/u.test(readText(cwd, "vite.config.ts") ?? "")) {
    steps.push(["test", "--project", "unit", "--passWithNoTests"]);
  }

  return steps;
};

export const commandLine = (steps: readonly Command[]) =>
  steps.map((args) => args.join(" ")).join(" && ");

const vpPrefix = async (packageManager: PackageManager): Promise<Command> => {
  if (packageManager === "pnpm" && !(await hasCommand("pnpm"))) {
    return [
      "npx",
      "--yes",
      `--package=pnpm@${toolchainVersions.pnpm}`,
      "--",
      "vp",
    ];
  }

  if (await hasCommand("vp")) {
    return ["vp"];
  }

  return packageManager === "pnpm"
    ? ["pnpm", "exec", "vp"]
    : ["bun", "x", "--no-install", "vp"];
};

export const maintenanceSteps = async (
  packageManager: PackageManager,
  checks: readonly string[][]
): Promise<Command[]> => {
  const prefix = await vpPrefix(packageManager);

  return [["install", "--no-frozen-lockfile"], ...checks].map(
    (args): Command => [...prefix, ...args]
  );
};

export const installAndCheck = async (
  cwd: string,
  steps: readonly Command[]
) => {
  for (const [command, ...args] of steps) {
    const result = await execa(command, args, {
      all: true,
      cwd,
      preferLocal: true,
      reject: false,
      stdin: "ignore",
    });

    if (result.failed) {
      throw new MaintenanceError(
        `${[command, ...args].join(" ")} failed:\n${result.all.slice(-12_000)}\nThe files are written. Fix the cause and rerun the step, or undo: ${undoHint}`
      );
    }
  }
};
