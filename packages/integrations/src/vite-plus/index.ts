import path from "node:path";

import type {
  Context,
  Formatter,
  PackageJsonContribution,
  ReadSlot,
} from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  formatter,
  gettingStarted,
  packageJson,
  pnpmWorkspace,
  renderFile,
  setupCommand,
} from "@vibestart/core";

import { hasBackend, hasWebApp } from "#/app.ts";
import { toolchainVersions } from "#/catalog.ts";
import { envFiles, renderEnvLines } from "#/env-files.ts";
import { commentedShell, joinWords, markdownTable, quote } from "#/format.ts";
import { formatWithProjectConfig } from "#/oxfmt.ts";
import { templateFiles } from "#/templates.ts";
import {
  agentsConventions,
  agentsMap,
  agentsNotes,
  agentsSections,
  fmtPresets,
  generatedFiles,
  ignoredFiles,
  lintOverrides,
  lintPlugins,
  lintPresets,
  readmeCommandNotes,
  readmeLayers,
  readmeOpen,
  readmeSections,
  readmeTagline,
  readySteps,
  rootTypeScriptFiles,
  testProjects,
  toolConventions,
  unitTestSources,
  vendoredFiles,
} from "#/vite-plus/slots.ts";
import type { ReadyStep, TestProject } from "#/vite-plus/slots.ts";

import agentsEffect from "../effect/agents-effect.md?raw";
import agentsCode from "./agents-code.md?raw";
import agentsDone from "./agents-done.md?raw";
import agentsVitePlus from "./agents-vite-plus.md?raw";

const formattedFile = /\.(?:css|html|js|json|jsonc|md|mjs|ts|tsx|ya?ml)$/u;

// `path.matchesGlob` compiles its patterns on every call, and every generation asks about the same paths.
const ignoredPaths = new Map<string, boolean>();

const isIgnored = (filePath: string, patterns: readonly string[]) => {
  const key = `${patterns.join("\0")}\0\0${filePath}`;
  let ignored = ignoredPaths.get(key);

  if (ignored === undefined) {
    ignored = patterns.some((pattern) => path.matchesGlob(filePath, pattern));
    ignoredPaths.set(key, ignored);
  }

  return ignored;
};

/** Formats like the generated project's `vp check`, so a file skipped here is one its `fmt` ignores too. */
const formatLikeProject =
  (ctx: Context): Formatter =>
  async (filePath, content, read) => {
    const [preset] = read(fmtPresets);

    const ignored = [
      ...(preset?.config.ignorePatterns ?? []),
      ...read(generatedFiles).map(({ glob }) => glob),
    ];

    if (!formattedFile.test(filePath) || isIgnored(filePath, ignored)) {
      return content;
    }

    const { code, errors } = await formatWithProjectConfig(
      filePath,
      content,
      ctx.scope,
      preset?.config ?? {}
    );

    const [error] = errors;

    if (error !== undefined) {
      throw new Error(`${filePath} does not parse: ${error.message}`);
    }

    return code;
  };

const checkStep = {
  command: "vp check",
  description: "format, lint, type check",
  label: "check",
};

const testDescription = (read: ReadSlot) =>
  `${joinWords(["unit", ...read(testProjects).map(({ name }) => name)])} tests (Vitest)`;

const testStep = (read: ReadSlot) => ({
  command: "vp test",
  description: testDescription(read),
  label: "test",
});

const orderedReadySteps = (read: ReadSlot): Omit<ReadyStep, "phase">[] => {
  const steps = read(readySteps);

  return [
    ...steps.filter((step) => step.phase === "prepare"),
    checkStep,
    ...steps.filter((step) => step.phase === "analyze"),
    testStep(read),
    ...steps.filter((step) => step.phase === "verify"),
  ];
};

const readyScript = (read: ReadSlot) =>
  [
    ...orderedReadySteps(read).map((step) => step.command),
    "vp run -r build",
  ].join(" && ");

const renderTestProject = ({ envDir, include, name }: TestProject) =>
  [
    "      {",
    "        test: {",
    `          env: loadEnv("test", \`\${import.meta.dirname}/${envDir}\`, ""),`,
    `          include: [${quote(include)}],`,
    `          name: ${quote(name)},`,
    "        },",
    "      },",
  ].join("\n");

const renderViteConfig = (ctx: Context, read: ReadSlot) => {
  const presets = read(lintPresets);
  const [base] = presets;
  const [fmt] = read(fmtPresets);
  const generated = read(generatedFiles).map(({ glob }) => quote(glob));
  const vendored = read(vendoredFiles).map(quote);

  const plugins = [
    ...read(lintPlugins),
    { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
  ];

  const overrides = read(lintOverrides);
  const projects = read(testProjects);

  const unitTests = [...read(unitTestSources), "packages/*/src"].map((source) =>
    quote(`${source}/**/*.test.ts`)
  );

  return [
    ...(fmt === undefined
      ? []
      : [`import ${fmt.name} from ${quote(fmt.module)};`]),
    ...presets.map(
      ({ name, module }) => `import ${name} from ${quote(module)};`
    ),
    `import { ${projects.length > 0 ? "defineConfig, loadEnv" : "defineConfig"} } from "vite-plus";`,
    "",
    ...[
      ...(generated.length > 0
        ? [`const generatedFiles = [${generated.join(", ")}];`]
        : []),
      ...(vendored.length > 0
        ? [`const vendoredFiles = [${vendored.join(", ")}];`]
        : []),
    ].flatMap((declaration) => [declaration, ""]),
    "export default defineConfig({",
    "  fmt: {",
    ...(fmt === undefined ? [] : [`    ...${fmt.name},`]),
    `    ignorePatterns: [${[
      ...(fmt === undefined ? [] : [`...(${fmt.name}.ignorePatterns ?? [])`]),
      ...(generated.length > 0 ? ["...generatedFiles"] : []),
    ].join(", ")}],`,
    '    proseWrap: "preserve",',
    "    sortImports: {",
    "      customGroups: [",
    "        {",
    `          elementNamePattern: [${quote(`${ctx.scope}/**`)}],`,
    '          groupName: "workspace",',
    "        },",
    "      ],",
    "      groups: [",
    '        "builtin",',
    '        "external",',
    '        "workspace",',
    '        ["internal", "subpath"],',
    '        ["parent", "sibling", "index"],',
    '        "style",',
    '        "unknown",',
    "      ],",
    "    },",
    "  },",
    "  lint: {",
    `    extends: [${presets.map(({ name }) => name).join(", ")}],`,
    `    ignorePatterns: [${[
      ...(base === undefined ? [] : [`...(${base.name}.ignorePatterns ?? [])`]),
      ...(generated.length > 0 ? ["...generatedFiles"] : []),
      ...(vendored.length > 0 ? ["...vendoredFiles"] : []),
    ].join(", ")}],`,
    "    jsPlugins: [",
    ...plugins.flatMap(({ comment, name, specifier }) => [
      ...(comment === undefined ? [] : [`      // ${comment}`]),
      `      { name: ${quote(name)}, specifier: ${quote(specifier)} },`,
    ]),
    "    ],",
    "    options: { typeAware: true, typeCheck: true },",
    ...(overrides.length > 0
      ? [
          "    overrides: [",
          ...overrides.map((override) => `${override},`),
          "    ],",
        ]
      : []),
    "    rules: {",
    '      "vite-plus/prefer-vite-plus-imports": "error",',
    "    },",
    "  },",
    "  staged: {",
    '    "*": "vp check --fix",',
    "  },",
    "  test: {",
    // Without integration tests the project ships no Vitest test, and `vp test` must still pass.
    ...(projects.length > 0 ? [] : ["    passWithNoTests: true,"]),
    "    projects: [",
    ...projects.map(renderTestProject),
    "      {",
    "        test: {",
    `          include: [${unitTests.join(", ")}],`,
    '          name: "unit",',
    "        },",
    "      },",
    "    ],",
    "  },",
    "});",
    "",
  ].join("\n");
};

const renderVscodeSettings = (read: ReadSlot) =>
  `${JSON.stringify(
    Object.fromEntries([
      ["npm.scriptRunner", "vp"],
      ["editor.defaultFormatter", "oxc.oxc-vscode"],
      ["editor.formatOnSave", true],
      ["editor.codeActionsOnSave", { "source.fixAll.oxc": "explicit" }],
      ["oxc.disableNestedConfig", true],
      ["oxc.fmt.disableNestedConfig", true],
      [
        "files.readonlyInclude",
        Object.fromEntries(
          read(generatedFiles).map(({ glob }) => [glob, true])
        ),
      ],
    ]),
    null,
    2
  )}\n`;

const renderRootTsconfig = (ctx: Context, read: ReadSlot) =>
  `${JSON.stringify(
    {
      extends: `${ctx.scope}/config/typescript/node.json`,
      include: ["vite.config.ts", ...read(rootTypeScriptFiles)],
    },
    null,
    2
  )}\n`;

const renderGitignore = (read: ReadSlot) =>
  [
    ...read(ignoredFiles),
    "",
    ".env",
    ".env.*",
    "",
    ".DS_Store",
    ".idea",
    ".vscode/*",
    "!.vscode/settings.json",
    "!.vscode/extensions.json",
    "",
  ].join("\n");

const renderAgents = (ctx: Context, read: ReadSlot) => {
  const generated = read(generatedFiles);

  const generatedLabels = generated.flatMap(({ label }) =>
    label === undefined ? [] : [`\`${label}\``]
  );

  const generatedNotes = generated.flatMap(({ note }) =>
    note === undefined ? [] : [` ${note}`]
  );

  const conventions = [
    ...read(agentsConventions),
    ...(generatedLabels.length === 0
      ? []
      : [
          {
            text: `${joinWords(generatedLabels)} ${generatedLabels.length === 1 ? "is" : "are"} tool output. Leave ${generatedLabels.length === 1 ? "it" : "them"} unchanged.${generatedNotes.join("")}`,
            title: "Generated",
          },
        ]),
    ...(ctx.has("effect")
      ? []
      : [
          {
            text: 'Import shared helpers from [es-toolkit](https://es-toolkit.dev/llms.txt), from the submodule the docs name (`import { retry } from "es-toolkit/function"`). `es-toolkit/compat` stays out.',
            title: "Utilities",
          },
        ]),
    ...read(toolConventions),
  ];

  return `${[
    agentsVitePlus.trimEnd(),
    ...(ctx.has("effect") ? [agentsEffect.trimEnd()] : []),
    "# Project",
    "`vibestart.jsonc` records the stack this project was created with. When it also records the `name` and `version` of the vibestart release that generated the project, the vibestart CLI maintains the project from it: `npx vibestart-cli add` adds a capability, and `npx vibestart-cli upgrade --dry-run` previews a template upgrade. Leave `vibestart.jsonc` as the CLI wrote it. An upgrade merges infrastructure files such as `package.json`, `vite.config.ts`, and this file, and lists template changes to starter source, which is yours to edit, as manual changes to port.",
    agentsCode.trimEnd(),
    "## Map",
    markdownTable(
      ["Path", "Owns"],
      [
        ...read(agentsMap).map((entry) => [`\`${entry.path}\``, entry.owns]),
        ["`packages/config`", "Shared TypeScript presets"],
      ]
    ),
    ...read(agentsNotes),
    "## Conventions",
    conventions.map(({ title, text }) => `- **${title}.** ${text}`).join("\n"),
    ...read(agentsSections),
    agentsDone.trimEnd(),
  ].join("\n\n")}\n`;
};

// The web app and the API run together; the mobile app has an interactive terminal of its own.
const hasDevServers = (ctx: Context) => hasWebApp(ctx) || hasBackend(ctx);

const devCommands = (ctx: Context): (readonly [string, string?])[] => {
  const servers = hasDevServers(ctx);

  return [
    ...(servers ? [["vp run dev"] as const] : []),
    ...(ctx.has("expo")
      ? [
          servers
            ? (["vp run dev:mobile", "in a second terminal"] as const)
            : (["vp run dev:mobile"] as const),
        ]
      : []),
  ];
};

// Git ignores every `.env`, so a fresh clone recreates them from this section.
const renderEnvironment = (ctx: Context, read: ReadSlot) => {
  const files = read(envFiles);

  if (files.length === 0) {
    return [];
  }

  const intro = ctx.has("better-auth")
    ? "Each app loads the `.env` in its directory. Project creation wrote them with the values below and generated a unique `BETTER_AUTH_SECRET`. Git ignores these files. For a fresh clone, recreate them from these examples and fill in the empty `BETTER_AUTH_SECRET` with the output of `openssl rand -base64 32`; the server rejects an unset secret."
    : "Each app loads the `.env` in its directory. Project creation wrote them with these values; git ignores them, so a fresh clone recreates them from here.";

  return [
    "## Environment",
    intro,
    ...files.map((envFile) =>
      [
        `\`${envFile.path}\``,
        "",
        "```dotenv",
        renderEnvLines(envFile.lines(read)),
        "```",
      ].join("\n")
    ),
  ];
};

const renderReadme = (ctx: Context, read: ReadSlot) => {
  const steps = orderedReadySteps(read);

  const commands = commentedShell([
    ...steps.map((step) => [step.command, step.description] as const),
    [
      "vp run ready",
      [...steps.map((step) => step.label), "production build"].join(" + "),
    ],
  ]);

  return `${[
    `# ${ctx.name}`,
    `${read(readmeTagline).join(" · ")}, on [Vite+](https://viteplus.dev).`,
    markdownTable(
      ["Layer", "Choice"],
      [
        ...read(readmeLayers).map(({ layer, choice }) => [layer, choice]),
        [
          "Toolchain",
          ctx.has("next")
            ? "Vite+ (`vp`): lint, format, type check, test; Next.js builds the app"
            : "Vite+ (`vp`): dev, build, test, lint, format, type check",
        ],
      ]
    ),
    "## Getting started",
    [
      "```sh",
      commentedShell([
        ["vp install"],
        ...read(gettingStarted).map(({ run, note }) =>
          note === undefined ? ([run] as const) : ([run, note.text] as const)
        ),
        ...devCommands(ctx),
      ]),
      "```",
    ].join("\n"),
    ...read(readmeOpen),
    ...renderEnvironment(ctx, read),
    "## Commands",
    ["```sh", commands, "```"].join("\n"),
    ...read(readmeCommandNotes),
    ...read(readmeSections).map((section) => section(read)),
  ].join("\n\n")}\n`;
};

const packageEngines = (
  ctx: Context
): NonNullable<PackageJsonContribution["engines"]> =>
  ctx.packageManager === "bun" && !ctx.has("bun")
    ? { bun: `>=${toolchainVersions.bun}`, node: toolchainVersions.node }
    : { node: toolchainVersions.node };

export const vitePlus = defineIntegration({
  contribute: (ctx) => [
    ...templateFiles(ctx, "vite-plus/common"),
    contribute(formatter, formatLikeProject(ctx)),
    contribute(setupCommand, {
      run: "vp install",
      stage: "install",
      writes: [ctx.packageManager === "bun" ? "bun.lock" : "pnpm-lock.yaml"],
    }),
    ...(hasDevServers(ctx)
      ? [
          contribute(packageJson, {
            path: ".",
            scripts: { dev: "vp run -r --parallel dev" },
          }),
        ]
      : []),
    contribute(packageJson, {
      path: ".",
      scripts: { build: "vp run -r build" },
    }),
    contribute(packageJson, {
      derivedScripts: { ready: readyScript },
      path: ".",
    }),
    contribute(packageJson, {
      devDependencies: [
        `${ctx.scope}/config`,
        "@types/node",
        "typescript",
        ...(hasWebApp(ctx) ? ["vite"] : []),
        "vite-plus",
      ],
      engines: packageEngines(ctx),
      packageManager:
        ctx.packageManager === "bun"
          ? `bun@${toolchainVersions.bun}`
          : `pnpm@${toolchainVersions.pnpm}`,
      path: ".",
      scripts: { prepare: "vp config" },
    }),
    contribute(packageJson, {
      exports: { "./typescript/*.json": "./typescript/*.json" },
      path: "packages/config",
    }),
    contribute(pnpmWorkspace, { allowBuilds: { esbuild: false } }),
    // Vite's plugins resolve `vite`, which Vite+ provides; a stack without a web app has no plugin.
    ...(hasWebApp(ctx)
      ? [
          contribute(pnpmWorkspace, {
            overrides: { "vite@*": "catalog:" },
            peerDependencyRules: {
              allowAny: ["vite"],
              allowedVersions: { vite: "*" },
            },
          }),
        ]
      : []),
    ...[
      "node_modules",
      "dist",
      "coverage",
      ".vitest",
      "*.tsbuildinfo",
      "*.local",
      "*.log",
    ].map((pattern) => contribute(ignoredFiles, pattern)),
    file(".gitattributes", "* text=auto eol=lf\n"),
    file(".vite-hooks/pre-commit", "vp staged\n"),
    file(
      ".vscode/extensions.json",
      '{\n  "recommendations": ["VoidZero.vite-plus-extension-pack"]\n}\n'
    ),
    renderFile(".vscode/settings.json", renderVscodeSettings),
    renderFile(".gitignore", renderGitignore),
    renderFile("tsconfig.json", (read) => renderRootTsconfig(ctx, read)),
    renderFile("vite.config.ts", (read) => renderViteConfig(ctx, read)),
    renderFile("AGENTS.md", (read) => renderAgents(ctx, read)),
    renderFile("README.md", (read) => renderReadme(ctx, read)),
  ],
  id: "vite-plus",
  kind: "toolchain",
  name: "Vite+",
  description: "Unified toolchain for dev, build, test, lint, and format",
  homepage: "https://viteplus.dev",
});
