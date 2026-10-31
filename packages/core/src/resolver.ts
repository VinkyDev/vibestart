import type { IntegrationInfo, Requirement, Stack } from "#/integration.ts";
import { alternatives } from "#/integration.ts";
import type { RegistryInfo } from "#/registry.ts";
import { getIntegration, integrationsOfKind } from "#/registry.ts";

export type Violation =
  | {
      readonly type: "unsupported-choice";
      readonly integration: string;
      readonly kind: string;
      readonly choices: readonly (string | null)[];
      readonly reason: string;
    }
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
      /** Any one of these capabilities would satisfy the integration. */
      readonly capabilities: readonly string[];
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

/**
 * Whether a requirement needs the integration in a stack: the integration meets it, and no alternative it
 * does not provide is provided by another. A single capability with one provider always needs its provider.
 */
export const needs = (
  requirement: Requirement,
  integration: IntegrationInfo,
  stack: readonly IntegrationInfo[]
) => {
  const accepted = alternatives(requirement);
  const own = (capability: string) => integration.provides.includes(capability);

  return (
    accepted.some(own) &&
    accepted.every(
      (capability) =>
        own(capability) || !stack.some((i) => i.provides.includes(capability))
    )
  );
};

export const check = (registry: RegistryInfo, stack: Stack): Violation[] => {
  const integrations = selectedIntegrations(registry, stack);

  const describe = (capability: string) =>
    registry.capabilities[capability] ?? capability;

  const kindName = (id: string) =>
    registry.kinds.find((kind) => kind.id === id)?.name ?? id;

  const missingKinds = [
    ...registry.kinds.flatMap((kind) => (kind.optional ? [] : [[kind.id]])),
    ...(registry.kindGroups ?? []),
  ].flatMap((kinds): Violation[] =>
    kinds.every((kind) => stack[kind] === undefined)
      ? [
          {
            kinds,
            reason: `${joinNames(kinds.map(kindName), "or")} is required.`,
            type: "missing-kind",
          },
        ]
      : []
  );

  const provided = (capability: string) =>
    integrations.some((i) => i.provides.includes(capability));

  const missingCapabilities = integrations.flatMap((integration) =>
    integration.requires
      .map(alternatives)
      .filter((accepted) => !accepted.some(provided))
      .map((accepted): Violation => ({
        capabilities: accepted,
        integration: integration.id,
        reason: `${integration.name} requires ${joinNames(accepted.map(describe), "or")}, but nothing in the stack provides it.`,
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
        !integrations.some((other) =>
          other.requires.some((requirement) =>
            needs(requirement, integration, integrations)
          )
        )
    )
    .map((integration): Violation => ({
      integration: integration.id,
      reason: `${integration.name} provides ${joinNames(integration.provides.map(describe))}, but nothing in the stack requires it.`,
      type: "unused-integration",
    }));

  const unsupportedChoices = integrations.flatMap((integration) =>
    Object.entries(integration.choices ?? {}).flatMap(
      ([kind, allowed]): Violation[] =>
        allowed.includes(stack[kind] ?? null)
          ? []
          : [
              {
                type: "unsupported-choice",
                integration: integration.id,
                kind,
                choices: allowed,
                reason: `${integration.name} supports ${joinNames(
                  allowed.map((id) =>
                    id === null ? "none" : getIntegration(registry, id).name
                  ),
                  "or"
                )} for ${kindName(kind)}.`,
              },
            ]
    )
  );

  return [
    ...unsupportedChoices,
    ...missingKinds,
    ...missingCapabilities,
    ...sharedCapabilities,
    ...unusedIntegrations,
  ];
};

/**
 * What a partial stack already gets wrong, counting only violations no later choice removes: an empty kind
 * group, a requirement no remaining kind can provide, and a capability two integrations provide.
 */
const unavoidableViolations = (
  chosen: readonly IntegrationInfo[],
  emptyKinds: ReadonlySet<string>,
  kindGroups: readonly (readonly string[])[],
  laterCapabilities: ReadonlySet<string>
) => {
  const provided = new Set<string>();
  const shared = new Set<string>();

  for (const integration of chosen) {
    for (const capability of new Set(integration.provides)) {
      if (provided.has(capability)) {
        shared.add(capability);
      }

      provided.add(capability);
    }
  }

  const emptyGroups = kindGroups.filter((group) =>
    group.every((kind) => emptyKinds.has(kind))
  ).length;

  const unmet = chosen.flatMap((integration) =>
    integration.requires
      .map(alternatives)
      .filter(
        (accepted) =>
          !accepted.some(
            (capability) =>
              provided.has(capability) || laterCapabilities.has(capability)
          )
      )
  ).length;

  const choices = new Map(
    chosen.map((integration) => [integration.kind, integration.id])
  );

  const unsupported = chosen.flatMap((integration) =>
    Object.entries(integration.choices ?? {}).filter(
      ([kind, allowed]) =>
        (choices.has(kind) || emptyKinds.has(kind)) &&
        !allowed.includes(choices.get(kind) ?? null)
    )
  ).length;

  return emptyGroups + unmet + shared.size + unsupported;
};

/**
 * Visits every stack consistent with the choices, in registry order: kinds as they are listed, and within a kind
 * its integrations, then the empty choice. A branch is skipped once its unavoidable violations reach `ceiling()`,
 * so a visit looking for legal or near-legal stacks reaches a sliver of the full product of kinds.
 */
const visitConsistentStacks = (
  registry: RegistryInfo,
  choices: Choices,
  ceiling: () => number,
  visit: (stack: Stack) => void
) => {
  const options = registry.kinds.map(
    (kind): (IntegrationInfo | undefined)[] => {
      const choice = choices[kind.id];

      if (choice === null) {
        return [undefined];
      }

      const integrations = integrationsOfKind(registry, kind.id);

      if (choice !== undefined) {
        return integrations.filter((i) => i.id === choice);
      }

      return kind.optional ? [...integrations, undefined] : integrations;
    }
  );

  const laterCapabilities = options.map(
    (_, index) =>
      new Set(
        options
          .slice(index + 1)
          .flat()
          .flatMap((integration) => integration?.provides ?? [])
      )
  );

  const kindGroups = registry.kindGroups ?? [];
  const chosen: IntegrationInfo[] = [];
  const emptyKinds = new Set<string>();

  const extend = (index: number, stack: Stack) => {
    const kind = registry.kinds[index];

    if (kind === undefined) {
      visit(stack);

      return;
    }

    const later = laterCapabilities[index] ?? new Set<string>();

    for (const integration of options[index] ?? []) {
      if (integration === undefined) {
        emptyKinds.add(kind.id);
      } else {
        chosen.push(integration);
      }

      if (
        unavoidableViolations(chosen, emptyKinds, kindGroups, later) < ceiling()
      ) {
        extend(
          index + 1,
          integration === undefined
            ? stack
            : { ...stack, [kind.id]: integration.id }
        );
      }

      if (integration === undefined) {
        emptyKinds.delete(kind.id);
      } else {
        chosen.pop();
      }
    }
  };

  extend(0, {});
};

const legalStacksCache = new WeakMap<RegistryInfo, readonly Stack[]>();

export const legalStacks = (registry: RegistryInfo): readonly Stack[] => {
  const cached = legalStacksCache.get(registry);

  if (cached !== undefined) {
    return cached;
  }

  // Every caller shares this array, so a caller that sorts or splices it fails instead of changing later results.
  const legal: Stack[] = [];

  visitConsistentStacks(
    registry,
    {},
    () => 1,
    (stack) => {
      if (check(registry, stack).length === 0) {
        legal.push(stack);
      }
    }
  );

  const frozen = Object.freeze(legal);

  legalStacksCache.set(registry, frozen);

  return frozen;
};

/** The first consistent stack, in registry order, with the fewest violations. */
const closestStack = (registry: RegistryInfo, choices: Choices) => {
  let closest: { stack: Stack; violations: Violation[] } | undefined;

  visitConsistentStacks(
    registry,
    choices,
    () => closest?.violations.length ?? Infinity,
    (stack) => {
      const violations = check(registry, stack);

      if (
        closest === undefined ||
        violations.length < closest.violations.length
      ) {
        closest = { stack, violations };
      }
    }
  );

  return closest;
};

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
  options: { readonly keep?: readonly string[] } = {}
): Resolution => {
  assertOffered(registry, choices);
  const pairs = decided(choices);

  const matches = (stack: Stack) =>
    pairs.every(([kind, id]) => (stack[kind] ?? null) === id);

  const stacks = legalStacks(registry).filter(matches);

  if (stacks.length > 0) {
    return { fixes: [], stacks, violations: [] };
  }

  const closest = closestStack(registry, choices);

  // Every offered choice appears in some combination, so `assertOffered` leaves one consistent.
  if (closest === undefined) {
    throw new Error("No combination is consistent with the choices");
  }

  const keep = options.keep ?? [];

  const candidates = legalStacks(registry)
    .filter((legal) =>
      keep.every(
        (kind) =>
          choices[kind] === undefined || (legal[kind] ?? null) === choices[kind]
      )
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
  options.flatMap(({ integration, violations }) =>
    violations.length === 0 ? [integration?.id ?? null] : []
  );

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

  assertOffered(registry, choices);

  // The open choices `kindOptions` would find, without the violations it works out for the others.
  let left = legalStacks(registry).filter((stack) =>
    Object.entries(choices).every(([k, id]) => (stack[k] ?? null) === id)
  );

  for (const kind of registry.kinds) {
    if (choices[kind.id] !== undefined) {
      continue;
    }

    const taken = new Set(left.map((stack) => stack[kind.id] ?? null));

    const open = [
      ...integrationsOfKind(registry, kind.id).map(({ id }) => id),
      ...(kind.optional ? [null] : []),
    ].filter((id) => taken.has(id));

    const start = startingChoice(open, kind.default);

    if (start === undefined) {
      throw new Error(`The choices leave no option of ${kind.id} open`);
    }

    choices[kind.id] = start;
    left = left.filter((stack) => (stack[kind.id] ?? null) === start);
  }

  const [stack] = resolve(registry, choices).stacks;

  if (stack === undefined) {
    throw new Error(
      "Every kind was chosen from options that leave a legal stack"
    );
  }

  return stack;
};
