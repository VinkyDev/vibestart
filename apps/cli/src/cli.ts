#!/usr/bin/env node
import { runMain } from "citty";

import { command } from "#/command.ts";
import {
  isMaintenanceCommand,
  maintenanceCommand,
} from "#/maintenance/commands.ts";

const rawArgs = process.argv.slice(2);
if (isMaintenanceCommand(rawArgs[0])) {
  process.exitCode = await maintenanceCommand(rawArgs);
} else {
  await runMain(command, {
    rawArgs: rawArgs[0] === "create" ? rawArgs.slice(1) : rawArgs,
  });
}
