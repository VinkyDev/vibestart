import type { Blueprint } from "#/blueprint.ts";
import { renderBlueprint } from "#/blueprint.ts";
import type { Violation } from "#/constraints.ts";
import { check } from "#/constraints.ts";
import type { Context, ReadSlot } from "#/integration.ts";
import { defineSlot } from "#/integration.ts";
import { packageJson, renderPackageJsons } from "#/package-json.ts";
import { pnpmWorkspace, renderPnpmWorkspace } from "#/pnpm-workspace.ts";
import type { Catalog, Registry } from "#/registry.ts";
import {
  addonsInOrder,
  getIntegration,
  selectedIntegrations,
} from "#/registry.ts";

export interface GeneratedFile {
  readonly path: string;
  readonly content: string;
  /** Integration or add-on id that owns the file, or `core` for files Core renders from contributions. */
  readonly owner: string;
}

export interface SetupCommand {
  /** Shell command run from the project root after the files are written. */
  readonly run: string;
  /** Globs of the paths the command writes. The generator leaves these files to the command. */
  readonly writes: readonly string[];
  /**
   * When the command runs: `install` first, then `generate` (code other commands import), then
   * `build` (the default). Commands in one stage run in contribution order.
   */
  readonly stage?: SetupStage;
}

export type SetupStage = "install" | "generate" | "build";

const setupStages: readonly SetupStage[] = ["install", "generate", "build"];

const stageOf = (command: SetupCommand) =>
  setupStages.indexOf(command.stage ?? "build");

export const setupCommand = defineSlot<SetupCommand>("setup-command");

export interface GettingStartedNote {
  /** Stays fixed when `text` is reworded, so a front end can show the note in another language. */
  readonly id: string;
  readonly text: string;
  /** The parts of `text` that vary with the stack, by name. */
  readonly values?: Readonly<Record<string, string>>;
}

export interface GettingStartedStep {
  /** Shell command a developer runs from the project root, after setup and before `vp run dev`. */
  readonly run: string;
  readonly note?: GettingStartedNote;
}

export const gettingStarted = defineSlot<GettingStartedStep>("getting-started");

export type Formatter = (
  path: string,
  content: string,
  read: ReadSlot
) => Promise<string>;

/** Contributed by the integration that owns the project's formatter, so renderers need not lay out their output. */
export const formatter = defineSlot<Formatter>("formatter");

export interface Generation {
  readonly files: readonly GeneratedFile[];
  /** In contribution order, which follows kind order. */
  readonly setup: readonly SetupCommand[];
  /** In contribution order. */
  readonly gettingStarted: readonly GettingStartedStep[];
  /** Every slot's contributions, for output rendered outside the project. */
  readonly read: ReadSlot;
}

export class IllegalStackError extends Error {
  readonly violations: readonly Violation[];

  constructor(violations: readonly Violation[]) {
    super(violations.map((violation) => violation.reason).join("\n"));
    this.name = "IllegalStackError";
    this.violations = violations;
  }
}

export const maxProjectNameLength = 50;

const projectName = new RegExp(
  `^[a-z][a-z0-9-]{0,${maxProjectNameLength - 1}}$`,
  "u"
);

export const projectNameError = (name: string) =>
  projectName.test(name)
    ? undefined
    : `Project name "${name}" must start with a lowercase letter, contain only lowercase letters, digits, and dashes, and be at most ${maxProjectNameLength} characters`;

const collectContributions = (
  registry: Registry,
  blueprint: Blueprint,
  name: string
) => {
  const integrations = selectedIntegrations(registry, blueprint.stack);
  const addonIds = addonsInOrder(registry, blueprint.addons);
  const addons = registry.addons.filter((addon) => addonIds.includes(addon.id));

  const contributors = [...integrations, ...addons];
  const selected = new Set(contributors.map(({ id }) => id));

  const ctx: Context = {
    packageManager: blueprint.packageManager ?? "pnpm",
    addons: addonIds,
    has: (id) => {
      const included = selected.has(id);

      // A misspelled id would otherwise read as an integration the stack left out.
      if (!included && !registry.addons.some((addon) => addon.id === id)) {
        getIntegration(registry, id);
      }

      return included;
    },
    name,
    scope: `@${name}`,
    stack: blueprint.stack,
  };

  const read: ReadSlot = (slot) => slot.values(ctx);

  const owned: {
    path: string;
    owner: string;
    render: (read: ReadSlot) => string;
  }[] = [];

  // Add-ons after the stack, so a slot lists what the stack contributes first.
  for (const integration of contributors) {
    for (const contribution of integration.contribute(ctx)) {
      if (contribution.type === "slot") {
        contribution.add(ctx);
      } else {
        owned.push({ ...contribution, owner: integration.id });
      }
    }
  }

  return { ctx, owned, read };
};

const workspaceFiles = (ctx: Context, catalog: Catalog, read: ReadSlot) => {
  const manifests = read(packageJson);
  const workspace = read(pnpmWorkspace);

  const packages = renderPackageJsons(manifests, {
    catalog,
    name: ctx.name,
    packageManager: ctx.packageManager,
    read,
    scope: ctx.scope,
    workspaceContributions: workspace,
  });

  if (ctx.packageManager === "bun") {
    return packages;
  }

  return [
    ...packages,
    {
      content: renderPnpmWorkspace({
        catalog,
        contributions: workspace,
        packagePaths: manifests.map(({ path }) => path),
        usedDependencies: new Set(
          packages.flatMap((pkg) => pkg.catalogDependencies)
        ),
      }),
      path: "pnpm-workspace.yaml",
    },
  ];
};

export const generate = async (
  registry: Registry,
  blueprint: Blueprint,
  options: {
    readonly name: string;
    /**
     * The vibestart release generating a project it will maintain, recorded with the name in `vibestart.jsonc`.
     * Previews and verification omit it, so their output does not change with each release.
     */
    readonly version?: string;
  }
): Promise<Generation> => {
  const { name, version } = options;
  const nameError = projectNameError(name);

  if (nameError !== undefined) {
    throw new Error(nameError);
  }

  const violations = check(registry, blueprint.stack);

  if (violations.length > 0) {
    throw new IllegalStackError(violations);
  }

  const { ctx, owned, read } = collectContributions(registry, blueprint, name);

  const coreFiles = [
    ...workspaceFiles(ctx, registry.catalog, read),
    {
      content: renderBlueprint(
        registry,
        blueprint,
        version === undefined ? undefined : { name, version }
      ),
      path: "vibestart.jsonc",
    },
  ].map(({ path, content }) => ({ content, owner: "core", path }));

  const files = new Map<string, GeneratedFile>();

  for (const generated of [
    ...coreFiles,
    ...owned.map(({ path, owner, render }) => ({
      content: render(read),
      owner,
      path,
    })),
  ]) {
    const existing = files.get(generated.path);

    if (existing !== undefined) {
      throw new Error(
        `${generated.path} is contributed by both ${existing.owner} and ${generated.owner}`
      );
    }

    files.set(generated.path, generated);
  }

  const [format, ...otherFormatters] = read(formatter);

  if (otherFormatters.length > 0) {
    throw new Error("More than one integration formats the project");
  }

  return {
    files: await Promise.all(
      [...files.values()]
        .toSorted((a, b) => (a.path < b.path ? -1 : 1))
        .map(async (generated) =>
          format === undefined
            ? generated
            : {
                ...generated,
                content: await format(generated.path, generated.content, read),
              }
        )
    ),
    gettingStarted: read(gettingStarted),
    read,
    setup: read(setupCommand).toSorted((a, b) => stageOf(a) - stageOf(b)),
  };
};
