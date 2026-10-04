import type { CANCEL_SYMBOL } from "@clack/prompts";
import { isCancel, multiselect, select, text } from "@clack/prompts";

import type { Choices, PackageManager, Stack } from "@vibestart/core";
import {
  compose,
  kindOptions,
  openChoices,
  startingChoice,
} from "@vibestart/core";
import { registry } from "@vibestart/integrations";

import { CliError } from "#/errors.ts";
import { noneLabel } from "#/options.ts";

const answer = <T>(value: T | typeof CANCEL_SYMBOL): T => {
  if (isCancel(value)) {
    throw new CliError({ code: "cancelled" }, "Cancelled.");
  }
  return value;
};

export const promptName = async (
  validate: (name: string) => string | undefined
) => {
  const name = answer(
    await text({
      defaultValue: "my-app",
      message: "Project name",
      placeholder: "my-app",
      validate: (value) =>
        validate(value === undefined || value === "" ? "my-app" : value),
    })
  );
  return name === "" ? "my-app" : name;
};

/**
 * Asks, in kind order, each kind the choices so far leave open. A kind with one remaining
 * option is filled without asking; an option that leaves no legal stack is shown disabled, with why.
 * Each answer starts on the initial stack's choice, else the kind's default, else the first option left open.
 */
export const promptCompose = async (
  fixed: Choices,
  initial?: Stack
): Promise<Stack> => {
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
    const options = kindOptions(registry, choices, kind.id);
    const open = openChoices(options);
    const start = startingChoice(
      open,
      initial === undefined ? kind.default : (initial[kind.id] ?? null)
    );
    if (open.length === 1 && start !== undefined) {
      choices[kind.id] = start;
      continue;
    }
    choices[kind.id] = answer(
      await select<string | null>({
        initialValue: start ?? null,
        message: kind.name,
        options: options.map(({ integration, violations }) => ({
          disabled: violations.length > 0,
          hint:
            violations.length > 0
              ? violations.map((violation) => violation.reason).join(" ")
              : (integration?.description ?? noneLabel(kind)),
          label: integration?.name ?? "None",
          value: integration?.id ?? null,
        })),
      })
    );
  }
  return compose(registry, choices);
};

export const promptAddons = async (initial: readonly string[]) =>
  registry.addons.length === 0
    ? []
    : answer(
        await multiselect<string>({
          initialValues: [...initial],
          message: "Extensions",
          options: registry.addons.map((addon) => ({
            hint: addon.description,
            label: addon.name,
            value: addon.id,
          })),
          required: false,
        })
      );

export type Decision = "create" | "customize";

export const promptDecision = async (dryRun: boolean) =>
  answer(
    await select<Decision>({
      message: dryRun ? "Preview this project?" : "Create this project?",
      options: [
        { label: dryRun ? "Preview it" : "Create it", value: "create" },
        { hint: "change any choice", label: "Customize", value: "customize" },
      ],
    })
  );

export const promptPackageManager = async (initial: PackageManager = "pnpm") =>
  answer(
    await select<PackageManager>({
      initialValue: initial,
      message: "Package manager",
      options: [
        { label: "pnpm", value: "pnpm" },
        { label: "Bun", value: "bun" },
      ],
    })
  );
