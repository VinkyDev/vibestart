import type { Violation } from "#/constraints.ts";
import { check, unavoidableViolations } from "#/constraints.ts";
import type { IntegrationInfo, Stack } from "#/integration.ts";
import type { RegistryInfo } from "#/registry.ts";
import { integrationsOfKind } from "#/registry.ts";

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

      const next =
        integration === undefined
          ? stack
          : { ...stack, [kind.id]: integration.id };

      if (
        unavoidableViolations(chosen, next, emptyKinds, kindGroups, later) <
        ceiling()
      ) {
        extend(index + 1, next);
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
