import { contribute, file, packageJson } from "@vibestart/core";

import { knipEntries } from "#/knip.ts";
import { ignoredFiles, rootTypeScriptFiles } from "#/vite-plus/slots.ts";

interface AlchemyProject {
  providers: string[];
  checks?: string;
  build?: boolean;
  migrate?: boolean;
  previewVariables?: string[];
}

const deploymentCommand = ({
  checks = "",
  build = false,
  migrate = false,
  previewVariables = [],
}: AlchemyProject) =>
  `import { spawnSync } from "node:child_process";

const env = { ...process.env };
const [action = "deploy", ...flags] = process.argv.slice(2);

const confirmDestroy = action === "destroy" && flags.length === 1 && flags[0] === "--yes";

if (!["plan", "deploy", "destroy"].includes(action)) {
  throw new Error("Expected plan, deploy or destroy");
}

if (flags.length > 0 && !confirmDestroy) {
  throw new Error("Only destroy accepts an optional --yes flag");
}

if (action === "destroy" && env.ALCHEMY_STAGE === undefined) {
  throw new Error("Set ALCHEMY_STAGE explicitly before destroying a deployment");
}

const stage = env.ALCHEMY_STAGE ?? "prod";

if (!/^[a-z][a-z0-9-]{0,30}$/u.test(stage)) {
  throw new Error("Set ALCHEMY_STAGE to a lowercase stage name of up to 31 characters");
}

${
  previewVariables.length > 0
    ? `
if (stage !== "prod") {
  const prefix = stage.toUpperCase().replaceAll("-", "_");

  for (const name of ${JSON.stringify(previewVariables)}) {
    env[name] = env[\`\${prefix}_\${name}\`];
  }
}
`
    : ""
}
${checks.trim() === "" ? "" : `if (action !== "destroy") {\n${checks.trim()}\n}\n\n`}const run = (args: string[]) => {
  const result = spawnSync("vp", args, { env, stdio: "inherit", shell: process.platform === "win32" });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

${build ? 'if (action !== "destroy") {\n  run(["run", "build"]);\n}\n\n' : ""}${migrate ? 'if (action === "deploy") {\n  run(["run", "db:migrate"]);\n}\n\n' : ""}run(["exec", "alchemy", action, "--stage", stage, ...(action === "deploy" || confirmDestroy ? ["--yes"] : [])]);
`;

export const alchemyProject = (settings: AlchemyProject) => {
  const platforms = ["@effect/platform-node", "@effect/platform-bun"];

  return [
    file("scripts/deploy.ts", deploymentCommand(settings)),
    contribute(rootTypeScriptFiles, "alchemy.run.ts"),
    contribute(rootTypeScriptFiles, "scripts/deploy.ts"),
    contribute(ignoredFiles, ".alchemy/"),
    contribute(packageJson, {
      path: ".",
      devDependencies: [
        "alchemy",
        "effect",
        ...settings.providers,
        ...platforms,
      ],
      scripts: {
        plan: "node scripts/deploy.ts plan",
        deploy: "node scripts/deploy.ts",
        destroy: "node scripts/deploy.ts destroy",
      },
    }),
    contribute(knipEntries, {
      workspace: ".",
      entry: ["alchemy.run.ts"],
      ignoreDependencies: platforms,
    }),
  ];
};
