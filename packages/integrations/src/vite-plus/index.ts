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

import { hasWebApp } from "#/app.ts";
import { toolchainVersions } from "#/catalog.ts";
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
  testProjects,
  toolConventions,
  unitTestSources,
  vendoredFiles,
} from "#/vite-plus/slots.ts";
import type { ReadyStep, TestProject } from "#/vite-plus/slots.ts";

import agentsCode from "./agents-code.md?raw";
import agentsDone from "./agents-done.md?raw";
import agentsVitePlus from "./agents-vite-plus.md?raw";

const formattedFile = /\.(?:css|html|js|json|jsonc|md|mjs|ts|tsx|ya?ml)$/u;

/** Formats like the generated project's `vp check`, so a file skipped here is one its `fmt` ignores too. */
const formatLikeProject =
  (ctx: Context): Formatter =>
  async (filePath, content, read) => {
    const [preset] = read(fmtPresets);
    const ignored = [
      ...(preset?.config.ignorePatterns ?? []),
      ...read(generatedFiles).map(({ glob }) => glob),
    ];
    if (
      !formattedFile.test(filePath) ||
      ignored.some((pattern) => path.matchesGlob(filePath, pattern))
    ) {
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
  const generated = [
    quote(".vibestart/**"),
    ...read(generatedFiles).map(({ glob }) => quote(glob)),
  ];
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
    ...(generated.length > 0
      ? [`const generatedFiles = [${generated.join(", ")}];`]
      : []),
    ...(vendored.length > 0
      ? [`const vendoredFiles = [${vendored.join(", ")}];`]
      : []),
    "",
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
    "      ignoreCase: true,",
    "      newlinesBetween: true,",
    '      order: "asc",',
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

const renderGitignore = (read: ReadSlot) =>
  [
    ...read(ignoredFiles),
    "",
    ".env",
    ".env.*",
    "!.env.example",
    "",
    ".DS_Store",
    ".idea",
    ".vscode/*",
    "!.vscode/settings.json",
    "!.vscode/extensions.json",
    "",
  ].join("\n");

const renderAgents = (read: ReadSlot) => {
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
    {
      text: 'Import shared helpers from [es-toolkit](https://es-toolkit.dev/llms.txt), from the submodule the docs name (`import { retry } from "es-toolkit/function"`). `es-toolkit/compat` stays out.',
      title: "Utilities",
    },
    ...read(toolConventions),
  ];

  return `${[
    agentsVitePlus.trimEnd(),
    "# Project",
    "The architecture this project was created with is recorded in `vibestart.jsonc`.",
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
        ["vp run dev"],
      ]),
      "```",
    ].join("\n"),
    ...read(readmeOpen),
    "## Commands",
    ["```sh", commands, "```"].join("\n"),
    ...read(readmeCommandNotes),
    ...read(readmeSections).map((section) => section(read)),
  ].join("\n\n")}\n`;
};

const packageEngines = (
  ctx: Context
): NonNullable<PackageJsonContribution["engines"]> => {
  const engines = { node: toolchainVersions.node };
  if (ctx.packageManager !== "bun") {
    return { ...engines, pnpm: toolchainVersions.pnpm };
  }
  if (!ctx.has("bun")) {
    return { ...engines, bun: `>=${toolchainVersions.bun}` };
  }
  return engines;
};

export const vitePlus = defineIntegration({
  contribute: (ctx) => [
    ...templateFiles(ctx, "vite-plus/common"),
    contribute(formatter, formatLikeProject(ctx)),
    contribute(setupCommand, {
      run: "vp install",
      writes: [ctx.packageManager === "bun" ? "bun.lock" : "pnpm-lock.yaml"],
    }),
    contribute(packageJson, {
      path: ".",
      scripts: {
        dev: "vp run -r --parallel dev",
        build: "vp run -r build",
      },
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
      devEngines: {
        packageManager: {
          name: ctx.packageManager ?? "pnpm",
          version:
            ctx.packageManager === "bun"
              ? toolchainVersions.bun
              : toolchainVersions.pnpm,
          onFail: "warn",
        },
      },
      engines: packageEngines(ctx),
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
    file(".node-version", `${toolchainVersions.node}\n`),
    file(
      ".vscode/extensions.json",
      '{\n  "recommendations": ["VoidZero.vite-plus-extension-pack"]\n}\n'
    ),
    renderFile(".vscode/settings.json", renderVscodeSettings),
    renderFile(".gitignore", renderGitignore),
    renderFile("vite.config.ts", (read) => renderViteConfig(ctx, read)),
    renderFile("AGENTS.md", renderAgents),
    renderFile("README.md", (read) => renderReadme(ctx, read)),
  ],
  id: "vite-plus",
  kind: "toolchain",
  name: "Vite+",
  description: "Unified toolchain for dev, build, test, lint, and format",
  homepage: "https://viteplus.dev",
});
