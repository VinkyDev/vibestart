import type { ArgsDef, ParsedArgs } from "citty";
import { z } from "zod";

import type { Choices, Kind, PackageManager } from "@vibestart/core";
import { addonsInOrder, defaultAddons, packageManagers } from "@vibestart/core";
import { registry } from "@vibestart/integrations";

import { CliError } from "#/errors.ts";

export const none = "none";

const kindValues = (kind: Kind) => [
  ...registry.integrations
    .filter((integration) => integration.kind === kind.id)
    .map((integration) => integration.id),
  ...(kind.optional ? [none] : []),
];

export const noneLabel = (kind: Kind) =>
  `No ${kind.name === kind.name.toUpperCase() ? kind.name : kind.name.toLowerCase()}`;

export const kindFlag = (kind: string, id: string | null) =>
  `--${kind} ${id ?? none}`;

export const addonsValue = (addons: readonly string[]) =>
  addons.length === 0 ? none : addons.join(",");

const addonIds = registry.addons.map((addon) => addon.id);

export const args: ArgsDef = {
  directory: {
    description:
      "Directory to create; its name is the project name (default: my-app)",
    required: false,
    type: "positional",
  },
  recipe: {
    description:
      "Start from a vibestart.jsonc file, directory, or URL; kind flags override it",
    type: "string",
    valueHint: "path|url",
  },
  ...Object.fromEntries(
    registry.kinds.map((kind) => [
      kind.id,
      {
        description: kind.name,
        type: "string",
        valueHint: kindValues(kind).join("|"),
      },
    ])
  ),
  "package-manager": {
    description:
      "Package manager (default: pnpm); independent of the Hono runtime",
    type: "string",
    valueHint: packageManagers.join("|"),
  },
  addons: {
    description: `Extensions, comma-separated (default: ${addonsValue(defaultAddons(registry))})`,
    type: "string",
    valueHint: [...addonIds, none].join("|"),
  },
  "dry-run": {
    description:
      "Resolve the stack and list the files, without writing anything",
    type: "boolean",
  },
  json: {
    description: "Print one JSON object on stdout and never prompt",
    type: "boolean",
  },
  list: {
    description:
      "List the kinds and their options, and every legal stack, then exit",
    type: "boolean",
  },
  interactive: {
    default: true,
    description:
      "Prompt for anything the flags leave open, when attached to a terminal",
    negativeDescription:
      "Never prompt; a stack the flags leave open is an error",
    type: "boolean",
  },
  git: {
    default: true,
    description: "Initialize a git repository",
    negativeDescription: "Skip git init",
    type: "boolean",
  },
  install: {
    default: true,
    description: "Install dependencies, run setup and vp fmt, then vp check",
    negativeDescription: "Only write the files",
    type: "boolean",
  },
  check: {
    default: true,
    description: "Run vp check after setup",
    negativeDescription: "Skip vp check",
    type: "boolean",
  },
};

const oneOf = (flag: string, values: readonly string[]) =>
  z
    .string({ error: `--${flag} takes one value` })
    .refine((value) => values.includes(value), {
      error: (issue) =>
        `--${flag} is one of ${values.join(", ")}; got ${JSON.stringify(issue.input)}`,
    });

const addonsFlag = z
  .string({ error: "--addons takes one value" })
  .transform((value, context) => {
    const ids = value === none ? [] : value.split(",");
    const unknown = ids.filter((id) => !addonIds.includes(id));
    if (unknown.length > 0) {
      context.addIssue({
        code: "custom",
        message: `--addons takes ${addonIds.join(", ")}, or ${none}; got ${unknown.map((id) => JSON.stringify(id)).join(", ")}`,
      });
      return z.NEVER;
    }
    return addonsInOrder(registry, ids);
  });

const flag = z.boolean({
  error: (issue) => `--${String(issue.path?.[0])} takes no value`,
});

const argsSchema = z.object({
  _: z.array(z.string()).max(1, {
    error: (issue) =>
      `Expected one directory, got ${JSON.stringify(issue.input)}`,
  }),
  addons: addonsFlag.optional(),
  "package-manager": z.enum(packageManagers).optional(),
  check: flag,
  "dry-run": flag.optional(),
  git: flag,
  install: flag,
  interactive: flag,
  json: flag.optional(),
  kinds: z.object(
    Object.fromEntries(
      registry.kinds.map((kind) => [
        kind.id,
        oneOf(kind.id, kindValues(kind)).optional(),
      ])
    )
  ),
  list: flag.optional(),
  recipe: z.string({ error: "--recipe takes one value" }).optional(),
});

export interface Options {
  readonly packageManager?: PackageManager;
  readonly directory: string | undefined;
  readonly recipe: string | undefined;
  readonly choices: Choices;
  /** From `--addons`, in registry order; undefined when it is not given. */
  readonly addons: readonly string[] | undefined;
  readonly dryRun: boolean;
  readonly json: boolean;
  readonly list: boolean;
  /** Prompts may run: a terminal on both ends and no `--no-interactive`, `--json`, or CI. */
  readonly interactive: boolean;
  readonly git: boolean;
  readonly install: boolean;
  readonly check: boolean;
}

const invalid = (message: string) =>
  new CliError(
    { code: "invalid-option" },
    `${message}\nRun with --help for every option.`
  );

/** citty keeps unknown flags as values, so a typo would pass unnoticed. */
const assertKnownFlags = (rawArgs: readonly string[]) => {
  const known = new Set(Object.keys(args));
  for (const token of rawArgs) {
    if (token === "--") {
      return;
    }
    const name = /^--(?:no-)?(?<name>[^=]+)/u.exec(token)?.groups?.name;
    if (token.startsWith("-") && (name === undefined || !known.has(name))) {
      throw invalid(`Unknown option ${token}.`);
    }
  }
};

export const parseOptions = (
  parsed: ParsedArgs,
  rawArgs: readonly string[]
): Options => {
  assertKnownFlags(rawArgs);
  const result = argsSchema.safeParse({
    ...parsed,
    kinds: Object.fromEntries(
      registry.kinds.map((kind) => [kind.id, parsed[kind.id]])
    ),
  });
  if (!result.success) {
    throw invalid(
      `${result.error.issues.map((issue) => issue.message).join(".\n")}.`
    );
  }
  const { data } = result;
  const json = data.json === true;
  return {
    addons: data.addons,
    packageManager: data["package-manager"],
    check: data.check,
    choices: Object.fromEntries(
      Object.entries(data.kinds).flatMap(([kind, value]) =>
        value === undefined ? [] : [[kind, value === none ? null : value]]
      )
    ),
    directory: data._[0],
    dryRun: data["dry-run"] === true,
    git: data.git,
    install: data.install,
    interactive:
      data.interactive &&
      !json &&
      process.stdin.isTTY &&
      process.stdout.isTTY &&
      process.env.CI !== "true",
    json,
    list: data.list === true,
    recipe: data.recipe,
  };
};
