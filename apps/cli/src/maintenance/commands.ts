import path from "node:path";

import { isCancel, multiselect } from "@clack/prompts";
import { z } from "zod";

import { createBlueprintSchema, diffText } from "@vibestart/core";
import { registry } from "@vibestart/integrations";

import { metadataFiles, readBaseline, readText } from "#/maintenance/files.ts";
import {
  normalizeInput,
  MaintenanceError,
  releaseId,
  serialize,
} from "#/maintenance/model.ts";
import type { Snapshot } from "#/maintenance/model.ts";
import type { Options } from "#/maintenance/options.ts";
import {
  approve,
  interactive,
  options,
  usage,
  validateOptions,
} from "#/maintenance/options.ts";
import { maintenanceText } from "#/maintenance/output.ts";
import { planUpdate } from "#/maintenance/plan.ts";
import {
  assertSourceCompatible,
  currentSnapshot,
  latestVersion,
  readSnapshot,
  targetSnapshot,
} from "#/maintenance/release.ts";
import {
  abort,
  pendingOperation,
  prepare,
  resume,
  rollback,
  withOperation,
} from "#/maintenance/transaction.ts";
import { loadRecipe } from "#/stack.ts";

const names = new Set([
  "add",
  "doctor",
  "upgrade",
  "adopt",
  "recover",
  "snapshot",
]);
export const isMaintenanceCommand = (name: string | undefined) =>
  name !== undefined && names.has(name);

const capabilities = () => [
  ...registry.addons
    .filter((addon) => addon.supportsAdd === true)
    .map(({ id, name, description }) => ({
      description,
      id,
      kind: "extension",
      name,
    })),
  ...registry.integrations
    .filter((integration) => integration.supportsAdd === true)
    .map(({ id, name, description, kind }) => ({
      description,
      id,
      kind,
      name,
    })),
];

const added = async (
  base: Snapshot,
  ids: readonly string[],
  values: Options
) => {
  let selected = [...ids];
  if (selected.length === 0 && interactive() && !values.json) {
    const answer = await multiselect({
      message: "Add capabilities",
      options: capabilities().map(({ id, name, description }) => ({
        hint: description,
        label: name,
        value: id,
      })),
      required: true,
    });
    if (isCancel(answer)) {
      throw new MaintenanceError("Cancelled", 130);
    }
    selected = answer;
  }
  if (selected.length === 0) {
    throw new MaintenanceError(
      "Choose a capability; see vibestart add --list.",
      2
    );
  }
  const blueprint = {
    ...base.blueprint,
    addons: [...base.blueprint.addons],
    stack: { ...base.blueprint.stack },
  };
  for (const id of selected) {
    const capability = capabilities().find((item) => item.id === id);
    if (capability === undefined) {
      throw new MaintenanceError(
        `Cannot add ${id}. This release supports: ${capabilities()
          .map((item) => item.id)
          .join(", ")}`,
        2
      );
    }
    if (capability.kind === "extension") {
      blueprint.addons = [...new Set([...blueprint.addons, id])];
    } else {
      const previous = blueprint.stack[capability.kind];
      if (previous !== undefined && previous !== id) {
        throw new MaintenanceError(
          `Adding ${id} would replace ${previous}; this needs an explicit migration.`
        );
      }
      blueprint.stack[capability.kind] = id;
    }
  }
  const current = await currentSnapshot(base.name, base.blueprint);
  if (releaseId(current) !== releaseId(base)) {
    throw new MaintenanceError(
      "requires-upgrade: run vibestart upgrade with this release before adding capabilities."
    );
  }
  return await currentSnapshot(base.name, blueprint);
};

const inspect = async (cwd: string, offline: boolean) => {
  const operation = pendingOperation(cwd);
  const base = readBaseline(cwd);
  const issues: string[] = [];
  if (operation !== null) {
    issues.push(`Operation ${operation.phase}: run vibestart recover`);
  }
  const recipe = await loadRecipe(cwd);
  const normalized = createBlueprintSchema(registry).parse({
    ...recipe,
    packageManager: recipe.packageManager ?? "pnpm",
  });
  const expected = createBlueprintSchema(registry).parse(base.blueprint);
  if (
    serialize(normalizeInput(normalized)) !==
    serialize(normalizeInput(expected))
  ) {
    issues.push(
      "vibestart.jsonc differs from the recorded choices; use lifecycle commands to change capabilities."
    );
  }
  const manifest = z
    .object({
      devEngines: z
        .object({ packageManager: z.object({ name: z.string() }) })
        .optional(),
      packageManager: z.string().optional(),
    })
    .parse(JSON.parse(readText(cwd, "package.json") ?? "{}"));
  const manager =
    manifest.packageManager?.split("@")[0] ??
    manifest.devEngines?.packageManager.name;
  if (manager !== base.blueprint.packageManager) {
    issues.push("package.json disagrees with the recorded package manager.");
  }
  const lockfile =
    base.blueprint.packageManager === "bun" ? "bun.lock" : "pnpm-lock.yaml";
  if (readText(cwd, lockfile) === null) {
    issues.push(`Missing ${lockfile}: run vp install`);
  }
  const target = await currentSnapshot(base.name, base.blueprint);
  const plan = planUpdate(cwd, base, target);
  return {
    conflicts: plan.conflicts.map(({ path: file }) => file),
    issues,
    latest: offline ? null : await latestVersion().catch(() => null),
    release: base.version,
    status:
      issues.length > 0 || plan.conflicts.length > 0 ? "attention" : "healthy",
    updates: plan.changes.length,
  };
};

const planFor = async (
  command: string,
  cwd: string,
  ids: readonly string[],
  values: Options
) => {
  if (command === "adopt") {
    if (values.from === undefined) {
      throw new MaintenanceError(
        "adopt requires --from <original-snapshot.json>; current edited files cannot serve as a baseline.",
        2
      );
    }
    if (readText(cwd, ".vibestart/state.json") !== null) {
      throw new MaintenanceError("This project already has a baseline.");
    }
    const source = readSnapshot(path.resolve(values.from));
    const recipe = await loadRecipe(cwd);
    const matches =
      serialize(
        normalizeInput(createBlueprintSchema(registry).parse(source.blueprint))
      ) ===
      serialize(normalizeInput(createBlueprintSchema(registry).parse(recipe)));
    if (!matches) {
      throw new MaintenanceError(
        "Original snapshot choices do not match this project's blueprint."
      );
    }
    const manifest = z
      .object({ name: z.string() })
      .parse(JSON.parse(readText(cwd, "package.json") ?? "{}"));
    if (manifest.name !== source.name) {
      throw new MaintenanceError(
        "Original snapshot project name does not match."
      );
    }
    return {
      changes: metadataFiles(source).map(({ path: file, content }) => ({
        after: content,
        before: readText(cwd, file),
        conflict: false,
        path: file,
      })),
      conflicts: [],
      target: source,
    };
  }
  const base = readBaseline(cwd);
  const recipe = createBlueprintSchema(registry).parse(await loadRecipe(cwd));
  const recorded = createBlueprintSchema(registry).parse(base.blueprint);
  if (
    serialize(normalizeInput(recipe)) !== serialize(normalizeInput(recorded))
  ) {
    throw new MaintenanceError(
      "Blueprint choices were edited outside maintenance. Restore them before upgrading; stack replacement requires a migration."
    );
  }
  const target =
    command === "add"
      ? await added(base, ids, values)
      : await targetSnapshot(base, values.to);
  if (command === "upgrade") {
    assertSourceCompatible(base, target);
  }
  return planUpdate(cwd, base, target);
};

interface Outcome {
  readonly exitCode: number;
  readonly status: string;
}

interface Listing extends Outcome {
  readonly capabilities: ReturnType<typeof capabilities>;
}

type Health = Outcome & Awaited<ReturnType<typeof inspect>>;

interface Planned extends Outcome {
  readonly changes: ReturnType<typeof planUpdate>["changes"];
  readonly conflicts: readonly string[];
  readonly release: string;
  readonly next?: string;
}

/**
 * Stated rather than inferred: inferred from `execute`'s returns, the bare `Outcome` of `recover` absorbs
 * the listing and the health report as its subtypes, and the text output can no longer tell them apart.
 */
export type MaintenanceResult = Listing | Health | Planned | Outcome;

const recover = async (cwd: string, values: Options): Promise<Outcome> => {
  await approve(values);
  return await withOperation(cwd, async () => {
    const journal = pendingOperation(cwd);
    if (journal === null) {
      return { exitCode: 0, status: "no-op" };
    }
    if (values.rollback) {
      return { exitCode: 0, status: rollback(cwd, journal) };
    }
    if (values.abort) {
      return { exitCode: 0, status: abort(cwd, journal) };
    }
    return {
      exitCode: 0,
      status: await resume(cwd, journal, !values["no-install"]),
    };
  });
};

const previewOnly = (values: Options) => values.check || values["dry-run"];

const printPlan = (plan: Awaited<ReturnType<typeof planFor>>) => {
  process.stdout.write(
    `${plan.changes.length} file changes, ${plan.conflicts.length} conflicts\n`
  );
  for (const change of plan.changes) {
    process.stdout.write(
      change.path.startsWith(".vibestart/")
        ? `  baseline: ${change.path}\n`
        : `${diffText(change)}\n`
    );
  }
};

const execute = async (
  command: string,
  ids: readonly string[],
  values: Options
): Promise<MaintenanceResult> => {
  const cwd = path.resolve(values.cwd);
  if (command === "add" && values.list) {
    return { capabilities: capabilities(), exitCode: 0, status: "available" };
  }
  if (command === "doctor") {
    const result = await inspect(cwd, values.offline ?? false);
    return { ...result, exitCode: result.status === "healthy" ? 0 : 1 };
  }
  if (command === "recover") {
    return await recover(cwd, values);
  }
  if (pendingOperation(cwd) !== null) {
    throw new MaintenanceError(
      "An operation is pending. Run vibestart recover first."
    );
  }
  const plan = await planFor(command, cwd, ids, values);
  const result = {
    changes: plan.changes,
    conflicts: plan.conflicts.map(({ path: file }) => file),
    release: releaseId(plan.target),
  };
  const previewing = previewOnly(values);
  if (!values.json) {
    printPlan(plan);
  }
  if (plan.conflicts.length > 0) {
    if (!previewing) {
      await approve(values);
      await withOperation(cwd, () => prepare(cwd, plan, values["full-check"]));
    }
    return {
      ...result,
      exitCode: 1,
      status: "conflicts",
      next: previewing
        ? "Preview only; no files were written. Apply the plan to prepare conflict candidates, then resolve them and run vibestart recover."
        : "Resolve candidates under .vibestart/pending/candidates, then run vibestart recover; vibestart recover --abort leaves project files unchanged.",
    };
  }
  if (previewing || plan.changes.length === 0) {
    return {
      ...result,
      exitCode: values.check && plan.changes.length > 0 ? 1 : 0,
      status: plan.changes.length === 0 ? "no-op" : "planned",
    };
  }
  await approve(values);
  return await withOperation(cwd, async () => {
    const journal = prepare(
      cwd,
      plan,
      values["full-check"],
      command === "adopt"
    );
    return {
      ...result,
      exitCode: 0,
      status: await resume(cwd, journal, !values["no-install"]),
    };
  });
};

export const maintenanceCommand = async (args: readonly string[]) => {
  const json = args.includes("--json");
  try {
    const { values, positionals } = options(args.slice(1));
    if (values.help) {
      process.stdout.write(
        json
          ? serialize({ exitCode: 0, ok: true, status: "help", usage })
          : usage
      );
      return 0;
    }
    const command = args[0] ?? "";
    validateOptions(command, positionals, values);
    if (command === "snapshot") {
      let text = "";
      for await (const chunk of process.stdin) {
        text += String(chunk);
      }
      const input = z
        .object({
          blueprint: createBlueprintSchema(registry),
          name: z.string(),
        })
        .parse(JSON.parse(text));
      process.stdout.write(
        serialize(await currentSnapshot(input.name, input.blueprint))
      );
      return 0;
    }
    const result = await execute(command, positionals, values);
    process.stdout.write(
      json
        ? `${JSON.stringify({ ...result, ok: result.exitCode === 0 }, null, 2)}\n`
        : maintenanceText(result, command, values.offline)
    );
    return result.exitCode;
  } catch (error) {
    const exitCode = error instanceof MaintenanceError ? error.exitCode : 1;
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(
      json
        ? serialize({ error: message, exitCode, ok: false, status: "failed" })
        : `${message}\n`
    );
    return exitCode;
  }
};
