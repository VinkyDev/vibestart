import { randomBytes } from "node:crypto";
import path from "node:path";

import type {
  Choices,
  Generation,
  PackageManager,
  Stack,
} from "@vibestart/core";
import {
  addonsInOrder,
  choicesOf,
  defaultAddons,
  generate,
  resolve,
} from "@vibestart/core";
import {
  materializeEnv,
  registry,
  renderEnvFiles,
  stackLabel,
  toolchainVersions,
  verificationOf,
} from "@vibestart/integrations";
import type { VerificationMatch } from "@vibestart/integrations";
import { devCommands } from "@vibestart/integrations/dev-commands";

import type { NextStep } from "#/create-summary.ts";
import { nextStepsText, stackSummary } from "#/create-summary.ts";
import type { Options } from "#/options.ts";
import type { StepResult, Target } from "#/project.ts";
import {
  assertTarget,
  hasCommand,
  runStep,
  targetError,
  targetOf,
  writeFiles,
} from "#/project.ts";
import {
  promptAddons,
  promptCompose,
  promptDecision,
  promptName,
  promptPackageManager,
} from "#/prompts.ts";
import {
  illegalStack,
  incompleteStack,
  loadRecipe,
  noninteractiveDefaults,
} from "#/stack.ts";
import type { Ui } from "#/ui.ts";

const chooseTarget = async ({ directory, interactive }: Options) => {
  if (directory === undefined && interactive) {
    return targetOf(await promptName((name) => targetError(targetOf(name))));
  }

  const target = targetOf(directory ?? "my-app");
  assertTarget(target);

  return target;
};

interface Given {
  readonly packageManager: PackageManager | undefined;
  readonly choices: Choices;
  /** Undefined when neither `--addons` nor the recipe names them. */
  readonly addons: readonly string[] | undefined;
}

const given = async (options: Options): Promise<Given> => {
  if (options.recipe === undefined) {
    return {
      addons: options.addons,
      choices: options.choices,
      packageManager: options.packageManager,
    };
  }

  const recipe = await loadRecipe(options.recipe);

  return {
    addons: options.addons ?? recipe.addons,
    packageManager: options.packageManager ?? recipe.packageManager,
    choices: { ...choicesOf(registry, recipe.stack), ...options.choices },
  };
};

/**
 * Prompts run only for the kinds the flags and the recipe leave open. Without prompts, a kind
 * left open takes its default, such as no deployment.
 */
const chooseStack = async (
  options: Options,
  choices: Choices
): Promise<Stack> => {
  const resolution = resolve(registry, choices, { keep: ["mode"] });
  const [only, ...others] = resolution.stacks;

  if (only === undefined) {
    throw illegalStack(resolution);
  }

  if (others.length === 0) {
    return only;
  }

  if (options.interactive) {
    return await promptCompose(choices);
  }

  const { stacks: defaulted } = resolve(
    registry,
    noninteractiveDefaults(choices)
  );

  const [chosen, ...rest] = defaulted;

  if (chosen === undefined || rest.length > 0) {
    throw incompleteStack(chosen === undefined ? resolution.stacks : defaulted);
  }

  return chosen;
};

const installVitePlus = {
  note: "install Vite+ (Windows: irm https://vite.plus/ps1 | iex)",
  run: "curl -fsSL https://vite.plus | bash",
};

const chooseAddons = async (options: Options, addons: Given["addons"]) => {
  if (addons !== undefined) {
    return addons;
  }

  const defaults = defaultAddons(registry);

  return options.interactive
    ? addonsInOrder(registry, await promptAddons(defaults))
    : defaults;
};

export interface CreateResult {
  readonly packageManager: PackageManager;
  readonly dryRun: boolean;
  readonly project: Target;
  readonly label: string;
  readonly stack: Stack;
  readonly addons: readonly string[];
  /** The stack's last passing `vp run ready` at this version, or `null`. */
  readonly verification: VerificationMatch["record"] | null;
  readonly fileCount: number;
  /** Only in a dry run. */
  readonly files?: readonly { readonly path: string; readonly owner: string }[];
  readonly steps: readonly StepResult[];
  readonly nextSteps: readonly NextStep[];
}

const bunInstallationSteps = async (
  packageManager: PackageManager,
  stack: Stack
): Promise<NextStep[]> => {
  const needsBun = packageManager === "bun" || stack.runtime === "bun";

  if (!needsBun || (await hasCommand("bun"))) {
    return [];
  }

  return [
    {
      run: `curl -fsSL https://bun.sh/install | bash -s "bun-v${toolchainVersions.bun}"`,
      note: 'install Bun (Windows: powershell -c "irm bun.sh/install.ps1 | iex")',
    },
  ];
};

const installProject = async (
  {
    check,
    directory,
    packageManager,
    setupCommands,
    vitePlus,
  }: {
    check: boolean;
    directory: string;
    packageManager: PackageManager;
    setupCommands: Generation["setup"];
    vitePlus: boolean;
  },
  ui: Ui
): Promise<StepResult[]> => {
  const steps: StepResult[] = [];

  if (!vitePlus) {
    ui.warn(
      `Vite+ is not installed, so ${packageManager} installs the project and its own \`vp\` runs the rest.`
    );
    steps.push(
      await runStep(
        ui,
        directory,
        packageManager === "bun"
          ? "bun install"
          : `npx --yes pnpm@${toolchainVersions.pnpm} install`
      )
    );
  }

  const projectStep = async (run: string) =>
    await runStep(ui, directory, run, { localBin: !vitePlus });

  // The bootstrap install already ran prepare and wrote the selected manager's lockfile.
  const setup = vitePlus
    ? setupCommands
    : setupCommands.filter(({ run }) => run !== "vp install");

  for (const { run } of setup) {
    steps.push(await projectStep(run));
  }

  steps.push(await projectStep("vp fmt"));

  if (check) {
    steps.push(await projectStep("vp check"));
  }

  return steps;
};

export const create = async (
  options: Options,
  ui: Ui,
  version: string
): Promise<CreateResult> => {
  ui.intro(`vibestart ${version}`);
  const target = await chooseTarget(options);
  const start = await given(options);
  let stack = await chooseStack(options, start.choices);
  let addons = await chooseAddons(options, start.addons);

  let packageManager =
    start.packageManager ??
    (options.interactive ? await promptPackageManager() : "pnpm");

  let match = await verificationOf(stack, addons, packageManager);
  let verification = match?.record;
  ui.note(
    "Your stack",
    stackSummary(stack, addons, verification, packageManager)
  );

  while (
    options.interactive &&
    (await promptDecision(options.dryRun)) === "customize"
  ) {
    stack = await promptCompose({}, stack);
    addons = addonsInOrder(registry, await promptAddons(addons));
    packageManager = await promptPackageManager(packageManager);
    match = await verificationOf(stack, addons, packageManager);
    verification = match?.record;
    ui.note(
      "Your stack",
      stackSummary(stack, addons, verification, packageManager)
    );
  }

  const generation = await generate(
    registry,
    { addons, channel: "recommended", packageManager, stack },
    { name: target.name, version }
  );

  const files = [
    ...generation.files.map((file) => ({
      owner: file.owner,
      path: file.path,
    })),
    ...renderEnvFiles(generation.read).map((file) => ({
      owner: "environment",
      path: file.path,
    })),
  ];

  const relative = path.relative(process.cwd(), target.directory);
  const vitePlus = await hasCommand("vp");
  const installBun = await bunInstallationSteps(packageManager, stack);

  const nextSteps: NextStep[] = [
    ...installBun,
    ...(vitePlus ? [] : [installVitePlus]),
    ...(relative === "" ? [] : [{ run: `cd ${relative}` }]),
    ...(options.install ? [] : generation.setup.map(({ run }) => ({ run }))),
    ...generation.gettingStarted.map(({ run, note }) => ({
      note: note?.text,
      run,
    })),
    { run: devCommands(stack)[0] },
  ];

  const result = {
    packageManager,
    addons,
    dryRun: options.dryRun,
    fileCount: files.length,
    label: stackLabel(stack),
    nextSteps,
    project: target,
    stack,
    steps: [],
    verification: verification ?? null,
  };

  if (options.dryRun) {
    ui.note(
      `${files.length} files`,
      files.map((file) => `${file.path}  (${file.owner})`).join("\n")
    );
    ui.outro("Dry run: nothing was written.");

    return {
      ...result,
      files,
    };
  }

  await writeFiles(target.directory, generation.files);
  materializeEnv(target.directory, generation.read, {
    authSecret: randomBytes(32).toString("base64"),
  });
  ui.info(`Wrote ${files.length} files to ${target.directory}`);

  const steps: StepResult[] = [];

  if (options.git) {
    if (await hasCommand("git")) {
      steps.push(await runStep(ui, target.directory, "git init"));
    } else {
      ui.warn("git is not installed, so the project is not a repository yet.");
    }
  }

  if (options.install) {
    steps.push(
      ...(await installProject(
        {
          check: options.check,
          directory: target.directory,
          packageManager,
          setupCommands: generation.setup,
          vitePlus,
        },
        ui
      ))
    );
  }

  ui.note("Next steps", nextStepsText(nextSteps));
  ui.outro(`${target.name} is ready.`);

  return { ...result, steps };
};
