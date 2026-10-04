import type { MaintenanceResult } from "#/maintenance/commands.ts";

const summaries = new Map([
  ["planned", "Preview complete. No files were written."],
  ["no-op", "No changes needed."],
  ["conflicts", "Conflicts need resolution before this operation can finish."],
  ["completed", "Maintenance completed with the selected checks."],
  [
    "adopted",
    "Baseline recorded. Dependencies and application behavior were not checked.",
  ],
  [
    "needs-install",
    "Files written. Installation and checks are still pending.\nNext (in the project directory): vibestart recover",
  ],
  [
    "rolled-back",
    "The unfinished operation was rolled back. Installed dependencies and database state were not restored.",
  ],
  [
    "aborted",
    "The pending plan was discarded; project files were left unchanged.",
  ],
]);

export const maintenanceText = (
  result: MaintenanceResult,
  command: string,
  offline = false
): string => {
  if ("capabilities" in result && result.capabilities !== undefined) {
    return [
      "Available capabilities:",
      ...result.capabilities.map(
        ({ id, name, description }) => `  ${id} — ${name}\n    ${description}`
      ),
      "",
      "Preview with: vibestart add <id> --dry-run",
      "",
    ].join("\n");
  }
  if ("issues" in result && result.issues !== undefined) {
    const lines = [
      result.status === "healthy"
        ? "Maintenance state is healthy. Application tests were not run."
        : "Maintenance state needs attention:",
      `Project template: ${result.release}`,
    ];
    if (offline) {
      lines.push("npm latest: not queried (--offline).");
    } else {
      lines.push(`npm latest: ${result.latest ?? "lookup unavailable"}`);
    }
    lines.push(
      ...result.issues.map((issue) => `  - ${issue}`),
      ...result.conflicts.map((file) => `  - Conflict: ${file}`),
      `Template changes with this CLI: ${result.updates}`
    );
    if (result.updates > 0 || result.conflicts.length > 0) {
      lines.push(
        "Inspect the plan in the project directory: vibestart upgrade --dry-run"
      );
    }
    return `${lines.join("\n")}\n`;
  }
  if (command === "recover" && result.status === "no-op") {
    return "No pending operation to recover.\n";
  }
  const lines = [summaries.get(result.status) ?? result.status];
  if ("conflicts" in result && result.conflicts !== undefined) {
    lines.push(...result.conflicts.map((file) => `  - Conflict: ${file}`));
  }
  if ("next" in result && result.next !== undefined) {
    lines.push(`Next (in the project directory): ${result.next}`);
  }
  return `${lines.join("\n")}\n`;
};
