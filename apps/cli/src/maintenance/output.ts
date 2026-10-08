import type { MaintenanceResult } from "#/maintenance/commands.ts";

const summaries = new Map([
  ["planned", "Preview complete. No files were written."],
  ["no-op", "No changes needed."],
  ["conflicts", "Conflicts need resolution before this operation can finish."],
  ["completed", "Maintenance completed with the selected checks."],
  ["needs-install", "Files written. Installation and checks were not run."],
]);

export const maintenanceText = (
  result: MaintenanceResult,
  offline: boolean
): string => {
  if ("capabilities" in result) {
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
  if ("issues" in result) {
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
      ...result.conflicts.map((file) => `  - Conflict: ${file}`)
    );
    if (result.updates === null || result.manual === null) {
      lines.push(
        `Template changes with this CLI: not compared (--offline; release ${result.release} comes from npm)`
      );
      return `${lines.join("\n")}\n`;
    }
    lines.push(
      `Template changes with this CLI: ${result.updates} to apply, ${result.manual} to port by hand`
    );
    if (
      result.updates > 0 ||
      result.manual > 0 ||
      result.conflicts.length > 0
    ) {
      lines.push(
        "Inspect the plan in the project directory: vibestart upgrade --dry-run"
      );
    }
    return `${lines.join("\n")}\n`;
  }
  const lines = [summaries.get(result.status) ?? result.status];
  lines.push(
    ...result.conflicts.map((file) => `  - Conflict: ${file}`),
    ...result.manual.map(({ path }) => `  - Port by hand: ${path}`)
  );
  if (result.next !== undefined) {
    lines.push(`Next (in the project directory): ${result.next}`);
  }
  return `${lines.join("\n")}\n`;
};
