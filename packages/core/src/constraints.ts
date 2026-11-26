import type { IntegrationInfo, Requirement, Stack } from "#/integration.ts";
import { alternatives } from "#/integration.ts";
import type { RegistryInfo } from "#/registry.ts";
import { getIntegration, selectedIntegrations } from "#/registry.ts";

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

const providersOf = (integrations: readonly IntegrationInfo[]) => {
  const providers = new Map<string, IntegrationInfo[]>();

  for (const integration of integrations) {
    for (const capability of new Set(integration.provides)) {
      const group = providers.get(capability);

      if (group === undefined) {
        providers.set(capability, [integration]);
      } else {
        group.push(integration);
      }
    }
  }

  return providers;
};

const unmetRequirements = (
  integration: IntegrationInfo,
  available: (capability: string) => boolean
) =>
  integration.requires
    .map(alternatives)
    .filter((accepted) => !accepted.some(available));

// undefined leaves the kind open during enumeration; null is a decision to omit it.
const excludedChoices = (
  integration: IntegrationInfo,
  choiceOf: (kind: string) => string | null | undefined
) =>
  Object.entries(integration.choices ?? {}).filter(([kind, allowed]) => {
    const choice = choiceOf(kind);

    return choice !== undefined && !allowed.includes(choice);
  });

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

  const providers = providersOf(integrations);
  const available = (capability: string) => providers.has(capability);

  const missingCapabilities = integrations.flatMap((integration) =>
    unmetRequirements(integration, available).map((accepted): Violation => ({
      capabilities: accepted,
      integration: integration.id,
      reason: `${integration.name} requires ${joinNames(accepted.map(describe), "or")}, but nothing in the stack provides it.`,
      type: "missing-capability",
    }))
  );

  const sharedCapabilities = [...providers].flatMap(
    ([capability, group]): Violation[] =>
      group.length > 1
        ? [
            {
              capability,
              integrations: group.map(({ id }) => id),
              reason: `${joinNames(group.map(({ name }) => name))} each provide ${describe(capability)}; a stack can have only one.`,
              type: "shared-capability",
            },
          ]
        : []
  );

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
    excludedChoices(integration, (kind) => stack[kind] ?? null).map(
      ([kind, allowed]): Violation => ({
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
      })
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
export const unavoidableViolations = (
  chosen: readonly IntegrationInfo[],
  stack: Stack,
  emptyKinds: ReadonlySet<string>,
  kindGroups: readonly (readonly string[])[],
  laterCapabilities: ReadonlySet<string>
) => {
  const providers = providersOf(chosen);

  const shared = [...providers.values()].filter(
    (group) => group.length > 1
  ).length;

  const available = (capability: string) =>
    providers.has(capability) || laterCapabilities.has(capability);

  const choiceOf = (kind: string) =>
    emptyKinds.has(kind) ? null : stack[kind];

  const emptyGroups = kindGroups.filter((group) =>
    group.every((kind) => emptyKinds.has(kind))
  ).length;

  const unmet = chosen.reduce(
    (count, integration) =>
      count + unmetRequirements(integration, available).length,
    0
  );

  const unsupported = chosen.reduce(
    (count, integration) =>
      count + excludedChoices(integration, choiceOf).length,
    0
  );

  return emptyGroups + unmet + shared + unsupported;
};
