import type {
  Addon,
  AddonInfo,
  Integration,
  IntegrationInfo,
  Kind,
} from "#/integration.ts";

/** Group name → package name → version range. Groups become comment headers in the catalog. */
export type Catalog = Readonly<
  Record<string, Readonly<Record<string, string>>>
>;

/** What the resolver reads of a registry. It serializes, so a browser can resolve stacks without the generator. */
export interface RegistryInfo {
  readonly kinds: readonly Kind[];
  /** Groups of optional kinds of which a stack must fill at least one, e.g. a framework or a backend. */
  readonly kindGroups?: readonly (readonly string[])[];
  /** Capability → noun phrase used in explanations, e.g. `an HTTP server`. */
  readonly capabilities: Readonly<Record<string, string>>;
  readonly integrations: readonly IntegrationInfo[];
  readonly addons: readonly AddonInfo[];
}

export interface Registry extends RegistryInfo {
  readonly integrations: readonly Integration[];
  readonly addons: readonly Addon[];
  readonly catalog: Catalog;
}

const findDuplicate = (values: readonly string[]) =>
  values.find((value, index) => values.indexOf(value) !== index);

export const defineRegistry = (registry: Registry): Registry => {
  const kindIds = registry.kinds.map((kind) => kind.id);
  // `Context.has` takes either, so an add-on and an integration share one namespace.
  const integrationIds = [
    ...registry.integrations.map((i) => i.id),
    ...registry.addons.map((addon) => addon.id),
  ];
  const duplicate =
    findDuplicate(kindIds) ??
    findDuplicate(integrationIds) ??
    findDuplicate(
      Object.values(registry.catalog).flatMap((group) => Object.keys(group))
    );
  if (duplicate !== undefined) {
    throw new Error(`Registry declares "${duplicate}" twice`);
  }

  for (const integration of registry.integrations) {
    if (!kindIds.includes(integration.kind)) {
      throw new Error(
        `Integration "${integration.id}" has unknown kind "${integration.kind}"`
      );
    }
    for (const capability of [
      ...integration.provides,
      ...integration.requires,
    ]) {
      if (registry.capabilities[capability] === undefined) {
        throw new Error(
          `Integration "${integration.id}" uses undescribed capability "${capability}"`
        );
      }
    }
  }

  for (const kind of (registry.kindGroups ?? []).flat()) {
    if (!kindIds.includes(kind)) {
      throw new Error(`Kind group names unknown kind "${kind}"`);
    }
  }

  for (const kind of registry.kinds) {
    if (!registry.integrations.some((i) => i.kind === kind.id)) {
      throw new Error(`Kind "${kind.id}" has no integrations`);
    }
  }

  return registry;
};

export const getIntegration = <I extends IntegrationInfo>(
  registry: { readonly integrations: readonly I[] },
  id: string
): I => {
  const integration = registry.integrations.find((i) => i.id === id);
  if (integration === undefined) {
    throw new Error(`Unknown integration "${id}"`);
  }
  return integration;
};

export const integrationsOfKind = <I extends IntegrationInfo>(
  registry: { readonly integrations: readonly I[] },
  kind: string
) => registry.integrations.filter((i) => i.kind === kind);

/** The add-ons a project takes unless it opts out, in registry order. */
export const defaultAddons = (registry: {
  readonly addons: readonly AddonInfo[];
}): readonly string[] =>
  registry.addons.filter((addon) => addon.default).map((addon) => addon.id);

/** A record taken with the default add-ons stands for any subset of them. */
export const defaultsCover = (
  registry: { readonly addons: readonly AddonInfo[] },
  addons: readonly string[]
) => addons.every((id) => defaultAddons(registry).includes(id));

/**
 * `ids` in registry order, without repeats. Throws for an id the registry does not declare, as
 * `getIntegration` does, so a misspelled add-on cannot pass as one left out.
 */
export const addonsInOrder = (
  registry: { readonly addons: readonly AddonInfo[] },
  ids: readonly string[]
): readonly string[] => {
  for (const id of ids) {
    if (!registry.addons.some((addon) => addon.id === id)) {
      throw new Error(`Unknown add-on "${id}"`);
    }
  }
  return registry.addons
    .filter((addon) => ids.includes(addon.id))
    .map((addon) => addon.id);
};
