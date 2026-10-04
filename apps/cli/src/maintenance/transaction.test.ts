import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it, vi } from "vite-plus/test";

import {
  initializeBaseline,
  readBaseline,
  readText,
  writeText,
} from "#/maintenance/files.ts";
import { snapshotOf } from "#/maintenance/model.ts";
import { planUpdate } from "#/maintenance/plan.ts";
import type { Runner } from "#/maintenance/transaction.ts";
import {
  abort,
  pendingOperation,
  prepare,
  resume,
  rollback,
  withOperation,
} from "#/maintenance/transaction.ts";

const roots: string[] = [];
const project = () => {
  const cwd = mkdtempSync(path.join(tmpdir(), "vibestart-maintenance-"));
  roots.push(cwd);
  return cwd;
};

const blueprint = {
  addons: [],
  channel: "recommended",
  packageManager: "bun",
  stack: {},
} as const;
const snapshot = (version: string) =>
  snapshotOf(version, "example", blueprint, [
    {
      content: `{"version":"${version}"}\n`,
      owner: "core",
      path: "package.json",
    },
    {
      content: `business ${version}`,
      owner: "react",
      path: "apps/web/src/index.ts",
    },
  ]);
const fixture = () => {
  const cwd = project();
  const base = snapshot("1.0.0");
  for (const file of base.files) {
    writeText(cwd, file.path, file.content);
  }
  writeText(cwd, "bun.lock", "old lock");
  initializeBaseline(cwd, base);
  const target = snapshot("1.1.0");
  return { base, cwd, plan: planUpdate(cwd, base, target), target };
};

describe("maintenance transactions", () => {
  afterAll(() => {
    for (const cwd of roots) {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("applies infrastructure, preserves business source, stores pure target, and installs once", async () => {
    const { cwd, plan, target } = fixture();
    const run = vi.fn<Runner>().mockResolvedValue();
    await resume(cwd, prepare(cwd, plan, false), true, run);
    expect(readText(cwd, "apps/web/src/index.ts")).toBe("business 1.0.0");
    expect(readBaseline(cwd)).toStrictEqual(target);
    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenNthCalledWith(1, cwd, [
      "install",
      "--no-frozen-lockfile",
    ]);
    expect(planUpdate(cwd, target, target).changes).toHaveLength(0);
  });

  it("records deferred installation and restores the old baseline and lockfile on rollback", async () => {
    const { base, cwd, plan } = fixture();
    const journal = prepare(cwd, plan, false);
    await expect(resume(cwd, journal, false)).resolves.toBe("needs-install");
    expect(pendingOperation(cwd)?.phase).toBe("applied");
    rollback(cwd, journal);
    expect(readBaseline(cwd)).toStrictEqual(base);
    expect(readText(cwd, "bun.lock")).toBe("old lock");
    expect(readText(cwd, "package.json")).toContain("1.0.0");
  });

  it("does not redo installation or reject user fixes after validation fails", async () => {
    const { cwd, plan } = fixture();
    const journal = prepare(cwd, plan, false);
    const run = vi
      .fn<Runner>()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error("invalid user code"));
    await expect(resume(cwd, journal, true, run)).rejects.toThrow(
      "invalid user code"
    );
    writeText(cwd, "apps/web/src/index.ts", "fixed business code");
    const recovered = pendingOperation(cwd);
    if (recovered === null) {
      throw new Error("Expected pending validation");
    }
    const retry = vi.fn<Runner>().mockResolvedValue();
    await resume(cwd, recovered, true, retry);
    expect(retry).toHaveBeenCalledExactlyOnceWith(cwd, ["check"]);
    expect(readText(cwd, "apps/web/src/index.ts")).toBe("fixed business code");
  });

  it("rejects rollback that would destroy a later edit before restoring any file", async () => {
    const { cwd, plan } = fixture();
    const journal = prepare(cwd, plan, false);
    await resume(cwd, journal, false);
    const state = readText(cwd, ".vibestart/state.json");
    writeText(cwd, "package.json", "user edit");
    expect(() => rollback(cwd, journal)).toThrow("newer edit");
    expect(readText(cwd, ".vibestart/state.json")).toBe(state);
  });

  it("resumes after a subset of files was written", async () => {
    const { cwd, plan } = fixture();
    const journal = prepare(cwd, plan, false);
    const [first] = journal.changes;
    if (first === undefined) {
      throw new Error("Expected a change");
    }
    writeText(cwd, first.path, first.after);
    await expect(resume(cwd, journal, false)).resolves.toBe("needs-install");
    expect(readBaseline(cwd).version).toBe("1.1.0");
  });

  it("detects edits made between planning and applying", () => {
    const { cwd, plan } = fixture();
    writeText(cwd, "package.json", "changed");
    expect(() => prepare(cwd, plan, false)).toThrow("Changed since planning");
    expect(pendingOperation(cwd)).toBeNull();
  });

  it("only aborts before project writes", async () => {
    const first = fixture();
    expect(abort(first.cwd, prepare(first.cwd, first.plan, false))).toBe(
      "aborted"
    );
    const second = fixture();
    const journal = prepare(second.cwd, second.plan, false);
    await resume(second.cwd, journal, false);
    expect(() => abort(second.cwd, journal)).toThrow("rollback");
  });

  it("does not mistake missing managed files for a no-op", () => {
    const { cwd, base } = fixture();
    writeText(cwd, "package.json", null);
    expect(
      planUpdate(cwd, base, base).conflicts.map((item) => item.path)
    ).toStrictEqual(["package.json"]);
  });

  it("blocks concurrent operations and releases the lock after failure", async () => {
    const cwd = project();
    await expect(
      withOperation(cwd, async () => {
        await withOperation(cwd, async () => {});
      })
    ).rejects.toThrow("project lock");
    await expect(
      withOperation(
        cwd,
        vi.fn<() => Promise<string>>().mockResolvedValue("available")
      )
    ).resolves.toBe("available");
  });

  it("rejects symlinked paths and traversal", () => {
    const cwd = project();
    const sibling = project();
    symlinkSync(sibling, path.join(cwd, "linked"));
    expect(() => {
      writeText(cwd, "linked/package.json", "{}");
    }).toThrow("symlink");
    expect(() => {
      writeText(cwd, "../escape", "{}");
    }).toThrow("relative");
  });

  it("saves conflict candidates without touching project files, then resumes an explicit resolution", async () => {
    const { base, cwd, target } = fixture();
    writeText(cwd, "package.json", '{"version":"business"}\n');
    const plan = planUpdate(cwd, base, target);
    const journal = prepare(cwd, plan, false);
    expect(readText(cwd, "package.json")).toContain("business");
    await expect(resume(cwd, journal, false)).rejects.toThrow("Resolve");
    writeText(
      cwd,
      ".vibestart/pending/candidates/package.json",
      '{"version":"business","accepted":true}\n'
    );
    await resume(cwd, journal, true, vi.fn<Runner>().mockResolvedValue());
    expect(readText(cwd, "package.json")).toContain("accepted");
    expect(readBaseline(cwd)).toStrictEqual(target);
    expect(planUpdate(cwd, target, target).changes).toHaveLength(0);
  });

  it("removes newly created capability files when rolling back", async () => {
    const { base, cwd, target } = fixture();
    target.files.push({
      content: "FROM example\n",
      owner: "docker",
      path: "Dockerfile",
    });
    const journal = prepare(cwd, planUpdate(cwd, base, target), false);
    await resume(cwd, journal, false);
    expect(readText(cwd, "Dockerfile")).toContain("FROM");
    rollback(cwd, journal);
    expect(readText(cwd, "Dockerfile")).toBeNull();
    expect(readBaseline(cwd)).toStrictEqual(base);
  });

  it("reinstalls if dependencies change after a validation failure", async () => {
    const { cwd, plan } = fixture();
    const journal = prepare(cwd, plan, false);
    const run = vi
      .fn<Runner>()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error("check failed"));
    await expect(resume(cwd, journal, true, run)).rejects.toThrow(
      "check failed"
    );
    writeText(
      cwd,
      "package.json",
      '{"version":"1.1.0","dependencies":{"hono":"2"}}'
    );
    const retry = vi.fn<Runner>().mockResolvedValue();
    await resume(cwd, journal, true, retry);
    expect(retry).toHaveBeenNthCalledWith(1, cwd, [
      "install",
      "--no-frozen-lockfile",
    ]);
    expect(retry).toHaveBeenNthCalledWith(2, cwd, ["check"]);
  });

  it("adoption only records provenance and does not resolve dependencies or run application setup", async () => {
    const { base, cwd } = fixture();
    const run = vi.fn<Runner>().mockResolvedValue();
    const plan = { changes: [], conflicts: [], target: base };
    await expect(
      resume(cwd, prepare(cwd, plan, false, true), true, run)
    ).resolves.toBe("adopted");
    expect(run).not.toHaveBeenCalled();
    expect(readText(cwd, "bun.lock")).toBe("old lock");
    expect(pendingOperation(cwd)).toBeNull();
  });

  it("uses full ready instead of repeating default validation", async () => {
    const { cwd, plan } = fixture();
    const run = vi.fn<Runner>().mockResolvedValue();
    await resume(cwd, prepare(cwd, plan, true), true, run);
    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenLastCalledWith(cwd, ["run", "ready"]);
  });
});
