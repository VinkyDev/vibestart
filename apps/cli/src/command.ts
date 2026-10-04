import type { ParsedArgs } from "citty";
import { defineCommand } from "citty";

import type { CreateResult } from "#/create.ts";
import { create } from "#/create.ts";
import type { Failure } from "#/errors.ts";
import { CliError } from "#/errors.ts";
import type { Listing } from "#/list.ts";
import { listing, listingText } from "#/list.ts";
import { args, parseOptions } from "#/options.ts";
import { humanUi, jsonUi } from "#/ui.ts";

import packageJson from "../package.json";

type JsonOutput =
  | ({ readonly ok: true } & Listing)
  | ({ readonly ok: true } & CreateResult)
  | {
      readonly ok: false;
      readonly error:
        | (Failure & { readonly message: string })
        | { readonly code: "internal"; readonly message: string };
    };

const printJson = (output: JsonOutput) => {
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
};

/** Runs the CLI and returns its exit code. `--json` prints exactly one JSON object, even on failure. */
const main = async (
  parsed: ParsedArgs,
  rawArgs: readonly string[]
): Promise<number> => {
  // Read before parsing, so an invalid option is reported as JSON too.
  const json = rawArgs.includes("--json");
  const ui = json
    ? jsonUi
    : humanUi(process.stdout.isTTY && process.env.CI !== "true");
  try {
    const options = parseOptions(parsed, rawArgs);
    if (options.list) {
      const listed = await listing();
      if (json) {
        printJson({ ok: true, ...listed });
      } else {
        process.stdout.write(listingText(listed));
      }
      return 0;
    }
    const result = await create(options, ui, packageJson.version);
    if (json) {
      printJson({ ok: true, ...result });
    }
    return 0;
  } catch (error) {
    if (!(error instanceof CliError)) {
      if (json) {
        printJson({
          error: { code: "internal", message: String(error) },
          ok: false,
        });
        return 1;
      }
      throw error;
    }
    if (json) {
      printJson({
        error: { ...error.failure, message: error.message },
        ok: false,
      });
    } else {
      ui.error(error);
    }
    return error.failure.code === "cancelled" ? 130 : 1;
  }
};

export const command = defineCommand({
  args,
  meta: {
    description:
      "Create a project from a stack. Commands: create, add, doctor, upgrade, adopt, recover. Use <command> --help for project maintenance, or --list for creation choices.",
    name: "vibestart",
    version: packageJson.version,
  },
  run: async ({ args: parsed, rawArgs }) => {
    process.exitCode = await main(parsed, rawArgs);
  },
});
