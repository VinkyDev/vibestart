import type { IntegrationInfo, Stack } from "#/integration.ts";
import type { RegistryInfo } from "#/registry.ts";
import { getIntegration, integrationsOfKind } from "#/registry.ts";

export type Violation =
  | {
      readonly type: "missing-kind";
      /** One of these kinds must be filled. */
      readonly kinds: readonly string[];
      readonly reason: string;
    }
  | {
      readonly type: "unused-integration";
      readonly integration: string;
      readonly reason: string;
    }
  | {
      readonly type: "missing-capability";
      readonly integration: string;
      readonly capability: string;
      readonly reason: string;
    }
  | {
      readonly type: "shared-capability";
      readonly capability: string;
      readonly integrations: readonly string[];
      readonly reason: string;
    };

/**
 * Kind id → the chosen integration id, or `null` for an optional kind chosen empty.
 * A kind that is absent is undecided, and any integration of it may complete the stack.
 */
export type Choices = Readonly<Partial<Record<string, string | null>>>;

export interface Change {
  readonly kind: string;
  readonly from: string | null;
  readonly to: string | null;
}

export interface Fix {
  /** Applied to the choices, these leave at least one legal stack. */
  readonly changes: readonly Change[];
}

export interface Resolution {
  /** Legal stacks consistent with every choice. */
  readonly stacks: readonly Stack[];
  /** Empty unless `stacks` is: why the consistent stack closest to legal is illegal. */
  readonly violations: readonly Violation[];
  /** Empty unless `stacks` is: the changes to the fewest choices that leave a legal stack. */
  readonly fixes: readonly Fix[];
}

export interface KindOption {
  /** `null` is the empty choice of an optional kind. */
  readonly integration: IntegrationInfo | null;
  /** Empty when choosing it leaves a legal stack. */
  readonly violations: readonly Violation[];
}

/** Integrations of a stack in kind order, which is also the order contributions are collected in. */
export const selectedIntegrations = <I extends IntegrationInfo>(
  registry: RegistryInfo & { readonly integrations: readonly I[] },
  stack: Stack
): I[] =>
  registry.kinds.flatMap((kind) => {
    const id = stack[kind.id];
    return id === undefined ? [] : [getIntegration(registry, id)];
  });

const joinNames = (names: readonly string[], conjunction = "and") =>
  names.length <= 2
    ? names.join(` ${conjunction} `)
    : `${names.slice(0, -1).join(", ")}, ${conjunction} ${names.at(-1)}`;

export const check = (registry: RegistryInfo, stack: Stack): Violation[] => {
  const integrations = selectedIntegrations(registry, stack);
  const describe = (capability: string) =>
    registry.capabilities[capability] ?? capability;
  const kindName = (id: string) =>
    registry.kinds.find((kind) => kind.id === id)?.name ?? id;

  const missingKinds = [
    ...registry.kinds.filter((kind) => !kind.optional).map((kind) => [kind.id]),
    ...(registry.kindGroups ?? []),
  ]
    .filter((kinds) => kinds.every((kind) => stack[kind] === undefined))
    .map((kinds): Violation => ({
      kinds,
      reason: `${joinNames(kinds.map(kindName), "or")} is required.`,
      type: "missing-kind",
    }));

  const missingCapabilities = integrations.flatMap((integration) =>
    integration.requires
      .filter(
        (capability) =>
          !integrations.some((i) => i.provides.includes(capability))
      )
      .map((capability): Violation => ({
        capability,
        integration: integration.id,
        reason: `${integration.name} requires ${describe(capability)}, but nothing in the stack provides it.`,
        type: "missing-capability",
      }))
  );

  const capabilities = [...new Set(integrations.flatMap((i) => i.provides))];
  const sharedCapabilities = capabilities.flatMap((capability): Violation[] => {
    const providers = integrations.filter((i) =>
      i.provides.includes(capability)
    );
    return providers.length > 1
      ? [
          {
            capability,
            integrations: providers.map((i) => i.id),
            reason: `${joinNames(providers.map((i) => i.name))} each provide ${describe(capability)}; a stack can have only one.`,
            type: "shared-capability",
          },
        ]
      : [];
  });

  const unusedIntegrations = integrations
    .filter(
      (integration) =>
        integration.auxiliary &&
        !integration.provides.some((capability) =>
          integrations.some((other) => other.requires.includes(capability))
        )
    )
    .map((integration): Violation => ({
      integration: integration.id,
      reason: `${integration.name} provides ${joinNames(integration.provides.map(describe))}, but nothing in the stack requires it.`,
      type: "unused-integration",
    }));

  return [
    ...missingKinds,
    ...missingCapabilities,
    ...sharedCapabilities,
    ...unusedIntegrations,
  ];
};

const allStacks = (registry: RegistryInfo): Stack[] => {
  let stacks: Stack[] = [{}];
  for (const kind of registry.kinds) {
    const options: (string | undefined)[] = integrationsOfKind(
      registry,
      kind.id
    ).map((i) => i.id);
    if (kind.optional) {
      options.push(undefined);
    }
    stacks = stacks.flatMap((stack) =>
      options.map((id) =>
        id === undefined ? stack : { ...stack, [kind.id]: id }
      )
    );
  }
  return stacks;
};

interface CheckedStack {
  readonly stack: Stack;
  readonly violations: readonly Violation[];
}

interface StackSpace {
  readonly checked: readonly CheckedStack[];
  readonly legal: readonly Stack[];
}

const checkedStacksCache = new WeakMap<RegistryInfo, StackSpace>();

const stackSpace = (registry: RegistryInfo): StackSpace => {
  const cached = checkedStacksCache.get(registry);
  if (cached !== undefined) {
    return cached;
  }
  const checked = allStacks(registry).map((stack) => ({
    stack,
    violations: check(registry, stack),
  }));
  const space = {
    checked,
    // Every caller shares this array, so a caller that sorts or splices it fails instead of changing later results.
    legal: Object.freeze(
      checked
        .filter(({ violations }) => violations.length === 0)
        .map(({ stack }) => stack)
    ),
  };
  checkedStacksCache.set(registry, space);
  return space;
};

export const legalStacks = (registry: RegistryInfo): readonly Stack[] =>
  stackSpace(registry).legal;

export const choicesOf = (registry: RegistryInfo, stack: Stack): Choices =>
  Object.fromEntries(
    registry.kinds.map((kind) => [kind.id, stack[kind.id] ?? null])
  );

const decided = (choices: Choices) =>
  Object.entries(choices).flatMap(([kind, id]) =>
    id === undefined ? [] : [[kind, id] as const]
  );

const assertOffered = (registry: RegistryInfo, choices: Choices) => {
  for (const [kind, id] of decided(choices)) {
    const offered =
      id === null
        ? registry.kinds.some((k) => k.id === kind && k.optional)
        : integrationsOfKind(registry, kind).some((i) => i.id === id);
    if (!offered) {
      throw new Error(
        `The registry offers no ${id === null ? "empty choice" : `"${id}"`} for kind "${kind}"`
      );
    }
  }
};

const changes = (choices: Choices, stack: Stack): Change[] =>
  decided(choices)
    .filter(([kind, id]) => (stack[kind] ?? null) !== id)
    .map(([kind, id]) => ({ from: id, kind, to: stack[kind] ?? null }));

export const resolve = (
  registry: RegistryInfo,
  choices: Choices,
  options: { readonly keep?: string } = {}
): Resolution => {
  assertOffered(registry, choices);
  const pairs = decided(choices);
  const matches = (stack: Stack) =>
    pairs.every(([kind, id]) => (stack[kind] ?? null) === id);
  const stacks = legalStacks(registry).filter(matches);
  if (stacks.length > 0) {
    return { fixes: [], stacks, violations: [] };
  }

  const consistent = stackSpace(registry).checked.filter(({ stack }) =>
    matches(stack)
  );
  const [closest] = consistent.toSorted(
    (a, b) => a.violations.length - b.violations.length
  );
  // Every offered choice appears in some combination, so `assertOffered` leaves one consistent.
  if (closest === undefined) {
    throw new Error("No combination is consistent with the choices");
  }
  const { keep } = options;
  const candidates = legalStacks(registry)
    .filter(
      (legal) => keep === undefined || (legal[keep] ?? null) === choices[keep]
    )
    .map((legal) => changes(choices, legal));
  const fewest = Math.min(...candidates.map((fix) => fix.length));
  const fixes = new Map(
    candidates
      .filter((fix) => fix.length === fewest)
      .map((fix) => [JSON.stringify(fix), { changes: fix }])
  );

  return {
    fixes: [...fixes.values()],
    stacks,
    violations: closest.violations,
  };
};

export const kindOptions = (
  registry: RegistryInfo,
  choices: Choices,
  kind: string
): KindOption[] => {
  const optional = registry.kinds.find((k) => k.id === kind)?.optional;
  if (optional === undefined) {
    throw new Error(`Unknown kind "${kind}"`);
  }
  return [
    ...integrationsOfKind(registry, kind),
    ...(optional ? [null] : []),
  ].map((integration) => ({
    integration,
    violations: resolve(registry, {
      ...choices,
      [kind]: integration?.id ?? null,
    }).violations,
  }));
};

export const withDefaults = (
  registry: RegistryInfo,
  choices: Choices
): Choices => {
  let current = choices;
  for (const kind of registry.kinds) {
    if (current[kind.id] === undefined && kind.default !== undefined) {
      const tentative = { ...current, [kind.id]: kind.default };
      if (resolve(registry, tentative).stacks.length > 0) {
        current = tentative;
      }
    }
  }
  return current;
};

export const openChoices = (options: readonly KindOption[]) =>
  options
    .filter(({ violations }) => violations.length === 0)
    .map(({ integration }) => integration?.id ?? null);

/** Where a kind starts among its open choices: on `preferred` when it is open, else on the first. Undefined when none is open. */
export const startingChoice = (
  open: readonly (string | null)[],
  preferred?: string | null
) =>
  preferred !== undefined && open.includes(preferred) ? preferred : open[0];

export const compose = (registry: RegistryInfo, fixed: Choices): Stack => {
  const choices: Record<string, string | null> = {};
  for (const [kind, id] of Object.entries(fixed)) {
    if (id !== undefined) {
      choices[kind] = id;
    }
  }
  for (const kind of registry.kinds) {
    if (choices[kind.id] !== undefined) {
      continue;
    }
    const start = startingChoice(
      openChoices(kindOptions(registry, choices, kind.id)),
      kind.default
    );
    if (start === undefined) {
      throw new Error(`The choices leave no option of ${kind.id} open`);
    }
    choices[kind.id] = start;
  }
  const [stack] = resolve(registry, choices).stacks;
  if (stack === undefined) {
    throw new Error(
      "Every kind was chosen from options that leave a legal stack"
    );
  }
  return stack;
};
