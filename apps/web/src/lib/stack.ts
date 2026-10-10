import { uniq } from "es-toolkit/array";
import { mapValues, omit } from "es-toolkit/object";
import { isEqual } from "es-toolkit/predicate";
import { registry, stacks } from "virtual:vibestart";
import { z } from "zod";

import type {
  AddonInfo,
  Change,
  Choices,
  IntegrationInfo,
  Stack,
} from "@vibestart/core";
import {
  addonsInOrder,
  alternatives,
  compose,
  defaultAddons,
  defaultsCover,
  needs,
  packageManagers,
  resolve,
} from "@vibestart/core";

import { capabilityText, list } from "#/lib/i18n.ts";
import type { StackEntry, StackVerification } from "#/lib/project.ts";
import { m } from "#/paraglide/messages.js";

const optionalDecisions = [
  "framework",
  "backend",
  "api",
  "database",
  "auth",
  "desktop",
  "deployment",
  "runtime",
] as const;

export const decisions = [...optionalDecisions, "testing"] as const;

export type Decision = (typeof decisions)[number];

export type OptionalDecision = (typeof optionalDecisions)[number];

export const isOptionalDecision = (kind: string): kind is OptionalDecision =>
  optionalDecisions.some((decision) => decision === kind);

export const isDecision = (kind: string): kind is Decision =>
  decisions.some((decision) => decision === kind);

export const none = "none";

export type Flags = Partial<Record<Decision, string>>;

const kindOf = (id: string) => {
  const kind = registry.kinds.find((k) => k.id === id);
  if (kind === undefined) {
    throw new Error(`The registry has no kind "${id}"`);
  }
  return kind;
};

export const integrationOf = (id: string): IntegrationInfo => {
  const integration = registry.integrations.find((i) => i.id === id);
  if (integration === undefined) {
    throw new Error(`The registry has no integration "${id}"`);
  }
  return integration;
};

export const addonOf = (id: string): AddonInfo | undefined =>
  registry.addons.find((addon) => addon.id === id);

export const chosen = (
  stack: Stack,
  kind: string
): IntegrationInfo | undefined => {
  const id = stack[kind];
  return id === undefined ? undefined : integrationOf(id);
};

/** A stack without a web app keeps the default runner, which then runs no end-to-end tests. */
export const e2eRunner = (stack: Stack): IntegrationInfo | undefined =>
  stack.framework === undefined ? undefined : chosen(stack, "testing");

export const optionsOf = (kind: string): (IntegrationInfo | null)[] => [
  ...registry.integrations.filter((integration) => integration.kind === kind),
  ...(kindOf(kind).optional ? [null] : []),
];

const decisionsOf = (stack: Stack): Choices =>
  Object.fromEntries(decisions.map((kind) => [kind, stack[kind] ?? null]));

const applied = (choices: Choices, changes: readonly Change[]): Choices => ({
  ...choices,
  ...Object.fromEntries(changes.map((change) => [change.kind, change.to])),
});

const entryOf = (choices: Choices): StackEntry => {
  const entry = stacks.find((candidate) =>
    decisions.every(
      (kind) => (candidate.stack[kind] ?? null) === (choices[kind] ?? null)
    )
  );
  if (entry === undefined) {
    throw new Error(
      `No legal stack has the decisions ${JSON.stringify(choices)}`
    );
  }
  return entry;
};

export const recommended: Stack = compose(registry, {});

const flag = z.string().optional();
const packageManagerSchema = z.enum(packageManagers).optional();

export const searchSchema = z.object({
  addons: flag,
  api: flag,
  auth: flag,
  backend: flag,
  database: flag,
  deployment: flag,
  desktop: flag,
  framework: flag,
  runtime: flag,
  testing: flag,
  packageManager: z.preprocess((value) => {
    const parsed = packageManagerSchema.safeParse(value);
    return parsed.success ? parsed.data : undefined;
  }, packageManagerSchema),
});

export type Search = z.infer<typeof searchSchema>;

export const parseFlags = (search: Search): Flags =>
  Object.fromEntries(
    decisions.flatMap((kind) => {
      const value = search[kind];
      const offered = optionsOf(kind).map(
        (integration) => integration?.id ?? none
      );
      if (value === undefined || !offered.includes(value)) {
        return [];
      }
      return [[kind, value]];
    })
  );

export const entryFromFlags = (flags: Flags): StackEntry => {
  const choices: Choices = mapValues(flags, (value) =>
    value === none ? null : value
  );
  const { fixes, stacks: legal } = resolve(registry, choices);
  const [only] = legal;
  if (legal.length === 1 && only !== undefined) {
    return entryOf(decisionsOf(only));
  }
  const [fix] = fixes;
  const fixed =
    legal.length > 0 || fix === undefined
      ? choices
      : applied(choices, fix.changes);
  return entryOf(decisionsOf(compose(registry, fixed)));
};

export const flagsOf = (stack: Stack): Flags => {
  let choices = decisionsOf(stack);
  for (const kind of decisions) {
    const fewer = omit(choices, [kind]);
    const { stacks: left } = resolve(registry, fewer);
    const [only] = left;
    if (
      left.length === 1 &&
      only !== undefined &&
      decisions.every((k) => only[k] === stack[k])
    ) {
      choices = fewer;
    }
  }
  if (choices.runtime === "node") {
    choices = omit(choices, ["runtime"]);
  }
  if (choices.testing === "playwright") {
    choices = omit(choices, ["testing"]);
  }
  return mapValues(choices, (id) => id ?? none);
};

export const verifiedAddons = defaultAddons(registry);

export const parseAddons = (value?: string): readonly string[] => {
  const ids = value === undefined || value === none ? [] : value.split(",");
  const offered = ids.every((id) =>
    registry.addons.some((addon) => addon.id === id)
  );
  return value === undefined || !offered
    ? verifiedAddons
    : addonsInOrder(registry, ids);
};

export const addonsFlag = (addons: readonly string[]) => {
  const value = addons.length === 0 ? none : addons.join(",");
  return isEqual(addons, verifiedAddons) ? undefined : value;
};

export const verificationWith = (
  entry: StackEntry,
  addons: readonly string[],
  packageManager: "pnpm" | "bun" = "pnpm"
): StackVerification | null => {
  if (!defaultsCover(registry, addons)) {
    return null;
  }
  return packageManager === "bun"
    ? (entry.bunVerification ?? null)
    : entry.verification;
};

export type PackageRunner = "pnpm" | "npm" | "bun";

const runners: Record<PackageRunner, string> = {
  bun: "bunx vibestart-cli",
  npm: "npx vibestart-cli",
  pnpm: "pnpm dlx vibestart-cli",
};

export const commandWords = (
  flags: Flags,
  name: string,
  runner: PackageRunner,
  addons: readonly string[] = verifiedAddons,
  packageManager: "pnpm" | "bun" = "pnpm"
) => {
  const addonsValue = addonsFlag(addons);
  return {
    flags: [
      ...decisions.flatMap((kind) => {
        const value = flags[kind];
        return value === undefined ? [] : [{ kind, value }];
      }),
      ...(packageManager === "bun"
        ? [{ kind: "package-manager" as const, value: "bun" }]
        : []),
      ...(addonsValue === undefined
        ? []
        : [{ kind: "addons" as const, value: addonsValue }]),
    ],
    name,
    runner: runners[runner],
  };
};

export const commandLine = (words: ReturnType<typeof commandWords>) =>
  [
    words.runner,
    words.name,
    ...words.flags.map(({ kind, value }) => `--${kind} ${value}`),
  ].join(" ");

export interface Outcome {
  readonly entry: StackEntry;
  readonly changes: readonly Change[];
}

export const outcome = (
  stack: Stack,
  kind: Decision,
  id: string | null
): Outcome | undefined => {
  const choices = { ...decisionsOf(stack), [kind]: id };
  const { fixes, stacks: legal } = resolve(registry, choices, { keep: kind });
  if (legal.length > 0) {
    return { changes: [], entry: entryOf(choices) };
  }
  const [fix] = fixes;
  if (fix === undefined) {
    return undefined;
  }
  return {
    changes: fix.changes,
    entry: entryOf(applied(choices, fix.changes)),
  };
};

export const selected = (stack: Stack): IntegrationInfo[] =>
  registry.integrations.filter(
    (integration) => stack[integration.kind] === integration.id
  );

export const whyIncluded = (
  stack: Stack,
  integration: IntegrationInfo
): string | undefined => {
  const integrations = selected(stack);
  const needed = integrations.flatMap((other) =>
    other.requires
      .filter((requirement) => needs(requirement, integration, integrations))
      .flatMap(alternatives)
      .filter((capability) => integration.provides.includes(capability))
      .map((capability) => ({ capability, other }))
  );
  if (needed.length === 0) {
    return undefined;
  }
  const capabilities = uniq(needed.map(({ capability }) => capability));
  const names = uniq(needed.map(({ other }) => other.name));
  return m.why_included({
    capabilities: list(
      "conjunction",
      capabilities.map((capability) => capabilityText(capability))
    ),
    count: names.length,
    names: list("conjunction", names),
  });
};
