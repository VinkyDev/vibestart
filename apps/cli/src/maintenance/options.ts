import { parseArgs } from "node:util";

import { confirm, isCancel } from "@clack/prompts";

import { MaintenanceError } from "#/maintenance/model.ts";

export const usage = `vibestart add [knip ultracite docker] [--list]
vibestart doctor [--offline]
vibestart upgrade [--to <exact-version>] [--check | --dry-run]
vibestart adopt --from <original-snapshot.json>
vibestart recover [--rollback | --abort]

Common: --cwd <project> --json --yes/-y --no-install --full-check
Writes show one plan and require --yes in non-interactive mode.
upgrade uses this CLI's template release unless --to selects another release.
--no-install leaves a resumable operation; recover installs and validates it.
Default validation: vp check, selected knip, and the unit test project.
--full-check runs vp run ready instead (including project services and browsers).
`;

export const options = (args: readonly string[]) => {
  try {
    const parsed = parseArgs({
      allowPositionals: true,
      args: [...args],
      options: {
        abort: { default: false, type: "boolean" },
        check: { default: false, type: "boolean" },
        cwd: { type: "string", default: process.cwd() },
        "dry-run": { default: false, type: "boolean" },
        from: { type: "string" },
        "full-check": { default: false, type: "boolean" },
        help: { default: false, type: "boolean", short: "h" },
        json: { default: false, type: "boolean" },
        list: { default: false, type: "boolean" },
        "no-install": { default: false, type: "boolean" },
        offline: { default: false, type: "boolean" },
        rollback: { default: false, type: "boolean" },
        to: { type: "string" },
        yes: { default: false, type: "boolean", short: "y" },
      },
    });
    if (parsed.values["no-install"] && parsed.values["full-check"]) {
      throw new Error("--no-install and --full-check cannot be combined");
    }
    if (parsed.values.rollback && parsed.values.abort) {
      throw new Error("Choose --rollback or --abort");
    }
    return parsed;
  } catch (error) {
    throw new MaintenanceError(String(error), 2);
  }
};
export type Options = ReturnType<typeof options>["values"];
export const interactive = () =>
  process.stdin.isTTY && process.stdout.isTTY && process.env.CI !== "true";

export const approve = async (values: Options) => {
  if (values.yes) {
    return;
  }
  if (!interactive() || values.json) {
    throw new MaintenanceError(
      "Use --yes to apply the displayed plan, or --dry-run to inspect it.",
      2
    );
  }
  const answer = await confirm({ message: "Apply this plan?" });
  if (isCancel(answer) || !answer) {
    throw new MaintenanceError("Cancelled", 130);
  }
};

export const validateOptions = (
  command: string,
  ids: readonly string[],
  values: Options
) => {
  if (command !== "add" && ids.length > 0) {
    throw new MaintenanceError(
      `${command} does not take positional arguments; use --cwd.`,
      2
    );
  }
  const exclusive = [
    values.check,
    values["dry-run"],
    values.rollback,
    values.abort,
  ].filter(Boolean);
  if (exclusive.length > 1) {
    throw new MaintenanceError("Choose one inspection or recovery mode.", 2);
  }
  const restricted = [
    { used: values.to !== undefined, commands: ["upgrade"], flag: "--to" },
    { used: values.from !== undefined, commands: ["adopt"], flag: "--from" },
    { used: values.list, commands: ["add"], flag: "--list" },
    { used: values.offline, commands: ["doctor"], flag: "--offline" },
    {
      used: values.rollback || values.abort,
      commands: ["recover"],
      flag: "--rollback/--abort",
    },
    { used: values.check, commands: ["upgrade"], flag: "--check" },
    {
      used: values["dry-run"],
      commands: ["upgrade", "add", "adopt"],
      flag: "--dry-run",
    },
    {
      used: values["no-install"] || values["full-check"],
      commands: ["upgrade", "add"],
      flag: "--no-install/--full-check",
    },
  ];
  const invalid = restricted.find(
    (item) => item.used && !item.commands.includes(command)
  );
  if (invalid !== undefined) {
    throw new MaintenanceError(
      `${invalid.flag} is not supported by ${command}.`,
      2
    );
  }
};
