import { spawnSync } from "node:child_process";

const env = { ...process.env };
const [action = "deploy", ...flags] = process.argv.slice(2);

const confirmDestroy =
  action === "destroy" && flags.length === 1 && flags[0] === "--yes";

if (!["plan", "deploy", "destroy"].includes(action)) {
  throw new Error("Expected plan, deploy or destroy");
}

if (flags.length > 0 && !confirmDestroy) {
  throw new Error("Only destroy accepts an optional --yes flag");
}

if (action === "destroy" && env.ALCHEMY_STAGE === undefined) {
  throw new Error(
    "Set ALCHEMY_STAGE explicitly before destroying a deployment"
  );
}

const stage = env.ALCHEMY_STAGE ?? "prod";

if (!/^[a-z][a-z0-9-]{0,30}$/u.test(stage)) {
  throw new Error(
    "Set ALCHEMY_STAGE to a lowercase stage name of up to 31 characters"
  );
}

const run = (args: string[]) => {
  const result = spawnSync("vp", args, {
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run([
  "exec",
  "alchemy",
  action,
  "--stage",
  stage,
  ...(action === "deploy" || confirmDestroy ? ["--yes"] : []),
]);
