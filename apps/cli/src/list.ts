import { defaultAddons, legalStacks } from "@vibestart/core";
import { registry, stackLabel, verificationOf } from "@vibestart/integrations";

import { addonsValue, kindFlag, none, noneLabel } from "#/options.ts";

export const listing = async () => ({
  packageManagers: ["pnpm", "bun"],
  defaultPackageManager: "pnpm",
  addons: registry.addons.map(
    ({ default: isDefault, description, id, name }) => ({
      default: isDefault,
      description,
      id,
      name,
    })
  ),
  kinds: registry.kinds.map((kind) => ({
    /** The option a stack gets when its kind is left open without prompts; `null` is none. */
    default: kind.default,
    id: kind.id,
    name: kind.name,
    optional: kind.optional,
    options: registry.integrations
      .filter((integration) => integration.kind === kind.id)
      .map(({ description, id, name }) => ({ description, id, name })),
  })),
  stacks: await Promise.all(
    legalStacks(registry).map(async (stack) => {
      const verification = await verificationOf(stack, defaultAddons(registry));
      return {
        label: stackLabel(stack),
        stack,
        verifiedAt: verification?.verifiedAt ?? null,
      };
    })
  ),
});

export type Listing = Awaited<ReturnType<typeof listing>>;

const columns = (
  rows: readonly (readonly [string, string])[],
  indent: string
) => {
  const width = Math.max(...rows.map(([left]) => left.length));
  return rows.map(
    ([left, right]) => `${indent}${left.padEnd(width)}  ${right}`
  );
};

const defaultMark = " (default)";

export const listingText = ({ addons, kinds, stacks }: Listing) =>
  [
    "Kinds (--<kind> <option>; a flag decides that kind, the rest follow from the choices)",
    ...kinds.flatMap((kind) => [
      `  --${kind.id}`,
      ...columns(
        [
          ...kind.options.map(
            (option) =>
              [
                option.id,
                `${option.name}: ${option.description}${option.id === kind.default ? defaultMark : ""}`,
              ] as const
          ),
          ...(kind.optional
            ? [
                [
                  none,
                  `${noneLabel(kind)}${kind.default === null ? defaultMark : ""}`,
                ] as const,
              ]
            : []),
        ],
        "      "
      ),
    ]),
    "",
    "Package manager (--package-manager pnpm|bun; default pnpm, independent of runtime)",
    "",
    "Extensions (--addons <id>[,<id>…] or none: tooling any stack takes or leaves)",
    ...columns(
      addons.map(
        (addon) =>
          [
            addon.id,
            `${addon.name}: ${addon.description}${addon.default ? defaultMark : ""}`,
          ] as const
      ),
      "  "
    ),
    "",
    `${stacks.length} legal stacks, ${stacks.filter((stack) => stack.verifiedAt !== null).length} verified at this version with the default add-ons. --list --json lists each.`,
    "",
    "Examples",
    "  npx vibestart-cli my-app",
    `  npx vibestart-cli my-app ${[kindFlag("framework", "next"), kindFlag("backend", "self"), kindFlag("api", "orpc"), kindFlag("database", "sqlite"), kindFlag("auth", null)].join(" ")} --no-interactive`,
    `  npx vibestart-cli my-api ${[kindFlag("frontend", null), kindFlag("api", "openapi"), kindFlag("database", "sqlite"), kindFlag("auth", null)].join(" ")} --addons ${addonsValue([])} --json`,
    "  npx vibestart-cli my-app --recipe ../other-app --json",
    "",
  ].join("\n");
