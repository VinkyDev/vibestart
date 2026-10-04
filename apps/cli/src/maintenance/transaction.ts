import {
  closeSync,
  mkdirSync,
  openSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { hostname } from "node:os";

import { execa } from "execa";
import type { ParseError } from "jsonc-parser";
import { parse } from "jsonc-parser";
import { z } from "zod";

import {
  modeOf,
  projectPath,
  readText,
  writeText,
} from "#/maintenance/files.ts";
import {
  hash,
  MaintenanceError,
  relativePath,
  serialize,
} from "#/maintenance/model.ts";
import type { Plan } from "#/maintenance/plan.ts";

const journalPath = ".vibestart/pending/journal.json";
const backupPath = ".vibestart/backup/files.json";
const itemSchema = z.strictObject({
  after: z.string().nullable(),
  before: z.string().nullable(),
  mode: z.number().int(),
  path: relativePath,
});
const journalSchema = z.strictObject({
  baselineOnly: z.boolean(),
  changes: z.array(itemSchema),
  conflicts: z.array(relativePath),
  fullCheck: z.boolean(),
  knip: z.boolean(),
  installedInput: z.string().nullable(),
  installPaths: z.array(relativePath),
  lockfiles: z.array(itemSchema),
  phase: z.enum([
    "conflicted",
    "prepared",
    "applying",
    "applied",
    "installing",
    "validating",
    "completed",
    "rolling-back",
  ]),
  schemaVersion: z.literal(1),
});
type Journal = z.infer<typeof journalSchema>;
export type Runner = (cwd: string, args: readonly string[]) => Promise<void>;

const runVp: Runner = async (cwd, args) => {
  const result = await execa("vp", args, {
    all: true,
    cwd,
    preferLocal: true,
    reject: false,
    stdin: "ignore",
  });
  if (result.failed) {
    throw new MaintenanceError(
      `vp ${args.join(" ")} failed:\n${result.all.slice(-12_000)}\nRun vibestart recover after fixing the cause, or recover --rollback.`
    );
  }
};

export const pendingOperation = (cwd: string) => {
  const content = readText(cwd, journalPath);
  return content === null ? null : journalSchema.parse(JSON.parse(content));
};
const save = (cwd: string, journal: Journal) => {
  writeText(cwd, journalPath, serialize(journal));
};

export const withOperation = async <T>(
  cwd: string,
  action: () => T | Promise<T>
): Promise<T> => {
  mkdirSync(projectPath(cwd, ".vibestart"), { recursive: true });
  const file = projectPath(cwd, ".vibestart/operation.lock");
  const previous = readText(cwd, ".vibestart/operation.lock");
  if (previous !== null) {
    const owner = z
      .object({ host: z.string(), pid: z.number() })
      .parse(JSON.parse(previous));
    let alive = true;
    if (owner.host === hostname()) {
      try {
        process.kill(owner.pid, 0);
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ESRCH"
        ) {
          alive = false;
        }
      }
    }
    if (alive) {
      throw new MaintenanceError(
        "Another maintenance process holds the project lock."
      );
    }
    unlinkSync(file);
  }
  const descriptor = openSync(file, "wx", 0o600);
  writeFileSync(descriptor, serialize({ host: hostname(), pid: process.pid }));
  try {
    return await action();
  } finally {
    closeSync(descriptor);
    unlinkSync(file);
  }
};

export const prepare = (
  cwd: string,
  plan: Plan,
  fullCheck: boolean,
  baselineOnly = false
) => {
  if (pendingOperation(cwd) !== null) {
    throw new MaintenanceError(
      "An operation is pending. Run vibestart recover first."
    );
  }
  for (const change of plan.changes) {
    if (readText(cwd, change.path) !== change.before) {
      throw new MaintenanceError(`Changed since planning: ${change.path}`);
    }
  }
  const changes = plan.changes.map(({ path, before, after }) => ({
    after,
    before,
    mode: modeOf(cwd, path),
    path,
  }));
  const lockfiles = ["bun.lock", "pnpm-lock.yaml"].map((path) => {
    const before = readText(cwd, path);
    return { after: before, before, mode: modeOf(cwd, path), path };
  });
  const journal: Journal = {
    baselineOnly,
    changes,
    conflicts: plan.conflicts.map(({ path }) => path),
    fullCheck,
    knip: plan.target.blueprint.addons.includes("knip"),
    installedInput: null,
    installPaths: [
      ...plan.target.files
        .filter(
          ({ path }) =>
            path.endsWith("package.json") || path === "pnpm-workspace.yaml"
        )
        .map(({ path }) => path),
      "bun.lock",
      "pnpm-lock.yaml",
    ],
    lockfiles,
    phase: plan.conflicts.length > 0 ? "conflicted" : "prepared",
    schemaVersion: 1,
  };
  // Persist backups before the first project write; the journal includes existence and file modes.
  writeText(cwd, backupPath, serialize([...changes, ...lockfiles]));
  for (const conflict of plan.conflicts) {
    writeText(
      cwd,
      `.vibestart/pending/candidates/${conflict.path}`,
      conflict.after
    );
  }
  save(cwd, journal);
  return journal;
};

const resolveCandidates = (cwd: string, journal: Journal) => {
  for (const file of journal.conflicts) {
    const candidate = readText(cwd, `.vibestart/pending/candidates/${file}`);
    if (candidate === null || /^(?:<{7}|={7}|>{7}|\|{7})/mu.test(candidate)) {
      throw new MaintenanceError(
        `Resolve .vibestart/pending/candidates/${file}, then run recover.`
      );
    }
    if (/\.jsonc?$/u.test(file)) {
      const errors: ParseError[] = [];
      parse(candidate, errors, { allowTrailingComma: true });
      if (errors.length > 0) {
        throw new MaintenanceError(
          `Resolved candidate is invalid JSONC: ${file}`
        );
      }
    }
    const item = journal.changes.find((change) => change.path === file);
    if (item === undefined) {
      throw new MaintenanceError(`Missing conflict plan for ${file}`);
    }
    item.after = candidate;
  }
  journal.conflicts = [];
  journal.phase = "prepared";
  save(cwd, journal);
};

const apply = (cwd: string, journal: Journal) => {
  journal.phase = "applying";
  save(cwd, journal);
  for (const change of journal.changes) {
    const current = readText(cwd, change.path);
    if (current === change.after) {
      continue;
    }
    if (current !== change.before) {
      throw new MaintenanceError(
        `Interrupted operation meets a newer edit: ${change.path}`
      );
    }
    writeText(cwd, change.path, change.after, change.mode);
  }
  journal.phase = "applied";
  save(cwd, journal);
};

const rememberLocks = (cwd: string, journal: Journal) => {
  journal.lockfiles = journal.lockfiles.map((item) => ({
    ...item,
    after: readText(cwd, item.path),
  }));
  save(cwd, journal);
};

const validations = (
  cwd: string,
  journal: Journal
): readonly (readonly string[])[] => {
  if (journal.fullCheck) {
    return [["run", "ready"]];
  }
  const steps = [["check"]];
  if (journal.knip) {
    steps.push(["run", "knip"]);
  }
  if (/name:\s*["']unit["']/u.test(readText(cwd, "vite.config.ts") ?? "")) {
    steps.push(["test", "--project", "unit", "--passWithNoTests"]);
  }
  return steps;
};

const installInput = (cwd: string, journal: Journal) =>
  hash(
    serialize(
      journal.installPaths.map((path) => ({
        path,
        content: readText(cwd, path),
      }))
    )
  );

export const resume = async (
  cwd: string,
  journal: Journal,
  install: boolean,
  run: Runner = runVp
) => {
  if (journal.phase === "completed") {
    writeText(cwd, journalPath, null);
    return "completed";
  }
  if (journal.phase === "rolling-back") {
    throw new MaintenanceError("Rollback is pending. Run recover --rollback.");
  }
  if (journal.phase === "conflicted") {
    resolveCandidates(cwd, journal);
  }
  if (journal.phase === "prepared" || journal.phase === "applying") {
    apply(cwd, journal);
  }
  if (journal.baselineOnly) {
    journal.phase = "completed";
    save(cwd, journal);
    writeText(cwd, journalPath, null);
    return "adopted";
  }
  if (!install) {
    return "needs-install";
  }
  if (
    journal.phase === "validating" &&
    journal.installedInput !== installInput(cwd, journal)
  ) {
    journal.phase = "applied";
  }
  if (journal.phase === "applied" || journal.phase === "installing") {
    journal.phase = "installing";
    save(cwd, journal);
    try {
      await run(cwd, ["install", "--no-frozen-lockfile"]);
    } finally {
      rememberLocks(cwd, journal);
    }
    journal.installedInput = installInput(cwd, journal);
    journal.phase = "validating";
    save(cwd, journal);
  }
  // Revalidate after any interrupted/failed validation; user fixes are intentionally allowed here.
  for (const args of validations(cwd, journal)) {
    await run(cwd, args);
  }
  writeText(
    cwd,
    ".vibestart/last-run.json",
    serialize({
      checks: validations(cwd, journal),
      files: journal.changes.map(({ path }) => ({
        hash: hash(readText(cwd, path) ?? ""),
        path,
      })),
      node: process.version,
      verifiedAt: new Date().toISOString(),
    })
  );
  journal.phase = "completed";
  save(cwd, journal);
  writeText(cwd, journalPath, null);
  return "completed";
};

export const rollback = (cwd: string, journal: Journal) => {
  const items = [...journal.changes, ...journal.lockfiles];
  for (const item of items) {
    const current = readText(cwd, item.path);
    if (current !== item.before && current !== item.after) {
      throw new MaintenanceError(
        `Rollback would overwrite a newer edit: ${item.path}. Save it elsewhere first.`
      );
    }
  }
  journal.phase = "rolling-back";
  save(cwd, journal);
  for (const item of items.toReversed()) {
    writeText(cwd, item.path, item.before, item.mode);
  }
  writeText(cwd, journalPath, null);
  return "rolled-back";
};

export const abort = (cwd: string, journal: Journal) => {
  if (
    (journal.phase !== "prepared" && journal.phase !== "conflicted") ||
    journal.changes.some((item) => readText(cwd, item.path) !== item.before)
  ) {
    throw new MaintenanceError(
      "Files have been applied; use recover --rollback instead."
    );
  }
  writeText(cwd, journalPath, null);
  return "aborted";
};
