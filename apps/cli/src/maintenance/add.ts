import { choicesOf, resolve } from "@vibestart/core";
import { registry } from "@vibestart/integrations";

import type { Input } from "#/maintenance/model.ts";
import { MaintenanceError } from "#/maintenance/model.ts";

export const capabilities = [
  ...registry.addons
    .filter((addon) => addon.supportsAdd === true)
    .map(({ id, name, description }) => ({
      description,
      id,
      kind: "extension",
      name,
    })),
  ...registry.integrations
    .filter((integration) => integration.supportsAdd === true)
    .map(({ id, name, description, kind }) => ({
      description,
      id,
      kind,
      name,
    })),
];

export const addCapabilities = (
  input: Input,
  selected: readonly string[]
): Input => {
  if (selected.length === 0) {
    throw new MaintenanceError(
      "Choose a capability; see vibestart add --list.",
      2
    );
  }

  const blueprint = {
    ...input,
    addons: [...input.addons],
    stack: { ...input.stack },
  };

  for (const id of selected) {
    const capability = capabilities.find((item) => item.id === id);

    if (capability === undefined) {
      throw new MaintenanceError(
        `Cannot add ${id}. This release supports: ${capabilities
          .map((item) => item.id)
          .join(", ")}`,
        2
      );
    }

    if (capability.kind === "extension") {
      blueprint.addons = [...new Set([...blueprint.addons, id])];
    } else {
      const previous = blueprint.stack[capability.kind];

      if (previous !== undefined && previous !== id) {
        throw new MaintenanceError(
          `Adding ${id} would replace ${previous}; this needs an explicit migration.`
        );
      }

      blueprint.stack[capability.kind] = id;
    }
  }

  const choices = choicesOf(registry, blueprint.stack);

  if (resolve(registry, choices).stacks.length > 0) {
    return blueprint;
  }

  // Auxiliary choices the project leaves open follow the selected product, such as the runtime of a SPA without a server.
  const required = Object.fromEntries(
    Object.entries(choices).filter(([kind]) => {
      const integrations = registry.integrations.filter(
        (integration) => integration.kind === kind
      );

      return !integrations.every((integration) => integration.auxiliary);
    })
  );

  const resolution = resolve(registry, required);
  const [stack] = resolution.stacks;

  if (stack === undefined) {
    throw new MaintenanceError(
      resolution.violations.map(({ reason }) => reason).join("\n")
    );
  }

  const replaced = Object.entries(blueprint.stack).flatMap(([kind, id]) =>
    stack[kind] === id ? [] : [`${id} with ${stack[kind] ?? "nothing"}`]
  );

  if (replaced.length > 0) {
    throw new MaintenanceError(
      `Adding ${selected.join(", ")} would replace ${replaced.join(", ")}; this needs an explicit migration.`
    );
  }

  return { ...blueprint, stack };
};
