import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import type { ParseError } from "jsonc-parser";
import { parse, printParseErrorCode } from "jsonc-parser";
import { z } from "zod";

import type { Resolution, Stack } from "@vibestart/core";
import { createBlueprintSchema } from "@vibestart/core";
import { registry } from "@vibestart/integrations";

import { CliError } from "#/errors.ts";
import { kindFlag } from "#/options.ts";

/**
 * Kinds left to decide, with each kind's remaining choices: those the kinds before them do not
 * determine, which are the kinds the interactive compose would ask.
 */
const openKinds = (stacks: readonly Stack[]) =>
  registry.kinds.flatMap((kind, index) => {
    const earlier = registry.kinds.slice(0, index);
    const byEarlier = Map.groupBy(stacks, (stack) =>
      JSON.stringify(earlier.map((k) => stack[k.id] ?? null))
    );
    const decides = [...byEarlier.values()].some(
      (group) => new Set(group.map((stack) => stack[kind.id] ?? null)).size > 1
    );
    const ids = [...new Set(stacks.map((stack) => stack[kind.id] ?? null))];
    return decides ? [{ ids, kind: kind.id }] : [];
  });

export const illegalStack = ({ fixes, violations }: Resolution) => {
  const flagFixes = fixes.map((fix) => ({
    changes: fix.changes,
    flags: fix.changes.map((change) => kindFlag(change.kind, change.to)),
  }));
  return new CliError(
    { code: "illegal-stack", fixes: flagFixes, violations },
    [
      "These choices leave no legal stack:",
      ...violations.map((violation) => `  ${violation.reason}`),
      "Change them to one of:",
      ...flagFixes.map((fix) => `  ${fix.flags.join(" ")}`),
    ].join("\n")
  );
};

export const incompleteStack = (stacks: readonly Stack[]) => {
  const open = openKinds(stacks).map(({ ids, kind }) => ({
    flags: ids.map((id) => kindFlag(kind, id)),
    kind,
    options: ids,
  }));
  return new CliError(
    { code: "incomplete-stack", open, stacks: stacks.length },
    [
      `These choices leave ${stacks.length} legal stacks. Choose:`,
      ...open.map(({ flags }) => `  ${flags.join(" | ")}`),
      "or start from a --recipe.",
    ].join("\n")
  );
};

const blueprintSchema = createBlueprintSchema(registry);

const readRecipe = async (source: string) => {
  if (/^https?:\/\//u.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new CliError(
        { code: "invalid-recipe" },
        `Fetching ${source} returned ${response.status} ${response.statusText}.`
      );
    }
    return await response.text();
  }
  try {
    const stats = await stat(source);
    const file = stats.isDirectory()
      ? path.join(source, "vibestart.jsonc")
      : source;
    return await readFile(file, "utf-8");
  } catch (error) {
    throw new CliError(
      { code: "invalid-recipe" },
      `Cannot read ${source}: ${String(error)}`
    );
  }
};

export const loadRecipe = async (source: string) => {
  const errors: ParseError[] = [];
  const data: unknown = parse(await readRecipe(source), errors, {
    allowTrailingComma: true,
  });
  if (errors.length > 0) {
    throw new CliError(
      { code: "invalid-recipe" },
      `${source} is not valid JSONC: ${errors.map((error) => `${printParseErrorCode(error.error)} at offset ${error.offset}`).join(", ")}.`
    );
  }
  const result = blueprintSchema.safeParse(data);
  if (!result.success) {
    throw new CliError(
      { code: "invalid-recipe" },
      `${source} is not a VibeStart blueprint:\n${z.prettifyError(result.error)}`
    );
  }
  return result.data;
};
