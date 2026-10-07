import { z } from "zod";

import type { Stack } from "#/integration.ts";
import type { Registry } from "#/registry.ts";
import {
  addonsInOrder,
  defaultAddons,
  integrationsOfKind,
} from "#/registry.ts";

export const blueprintSchemaUrl = "https://vibestart.dev/schema.json";

export const channels = ["recommended"] as const;
export const packageManagers = ["pnpm", "bun"] as const;
export type PackageManager = (typeof packageManagers)[number];

export interface Blueprint {
  /** Defaults to pnpm for existing recipes. Independent of the application runtime. */
  readonly packageManager?: PackageManager;
  readonly stack: Stack;
  /** Add-on ids. The generator takes them in registry order. */
  readonly addons: readonly string[];
  readonly channel: (typeof channels)[number];
}

const kindIds = (registry: Registry, kind: string) => {
  const integrations = integrationsOfKind(registry, kind);
  const [first, ...rest] = integrations.map((integration) => integration.id);
  if (first === undefined) {
    throw new Error(`Kind "${kind}" has no integrations`);
  }
  const current = z.enum([first, ...rest]);
  const renames = new Map(
    integrations.flatMap((integration) =>
      (integration.formerIds ?? []).map((former) => [former, integration.id])
    )
  );
  const [firstFormer, ...otherFormer] = renames.keys();
  return firstFormer === undefined
    ? current
    : current.or(
        z
          .enum([firstFormer, ...otherFormer])
          .meta({ deprecated: true })
          .transform((former) => renames.get(former) ?? former)
      );
};

export const createBlueprintSchema = (registry: Registry) => {
  const stack = Object.fromEntries(
    registry.kinds.map((kind) => {
      const ids = kindIds(registry, kind.id);
      return [kind.id, kind.optional ? ids.optional() : ids];
    })
  );

  const [firstAddon, ...otherAddons] = registry.addons.map((addon) => addon.id);
  const addonId =
    firstAddon === undefined ? z.never() : z.enum([firstAddon, ...otherAddons]);
  return z.strictObject({
    $schema: z.string().optional(),
    // A blueprint that names no add-ons takes the defaults, as a project created without choosing does.
    addons: z
      .array(addonId)
      .default(() => [...defaultAddons(registry)])
      .transform((ids) => [...addonsInOrder(registry, ids)]),
    channel: z.enum(channels),
    packageManager: z.enum(packageManagers).optional(),
    stack: z.strictObject(stack),
  });
};

/** The JSON Schema served at `blueprintSchemaUrl`, for editor completion in `vibestart.jsonc`: what a file may say. */
export const blueprintJsonSchema = (registry: Registry) =>
  z.toJSONSchema(createBlueprintSchema(registry), { io: "input" });

export const renderBlueprint = (registry: Registry, blueprint: Blueprint) => {
  const entries = registry.kinds.flatMap((kind) => {
    const id = blueprint.stack[kind.id];
    return id === undefined ? [] : [`    "${kind.id}": "${id}",`];
  });

  return [
    "{",
    `  "$schema": "${blueprintSchemaUrl}",`,
    "",
    '  "stack": {',
    ...entries,
    "  },",
    "",
    `  "addons": [${addonsInOrder(registry, blueprint.addons)
      .map((id) => `"${id}"`)
      .join(", ")}],`,
    "",
    `  "channel": "${blueprint.channel}",`,
    ...(blueprint.packageManager === undefined ||
    blueprint.packageManager === "pnpm"
      ? []
      : [`  "packageManager": "${blueprint.packageManager}",`]),
    "}",
    "",
  ].join("\n");
};
