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

if (stage !== "prod") {
  const prefix = stage.toUpperCase().replaceAll("-", "_");

  for (const name of [
    "DATABASE_URL",
    "HYPERDRIVE_ID",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
  ]) {
    env[name] = env[`${prefix}_${name}`];
  }
}

if (action !== "destroy") {
  if (action === "deploy" && (env.DATABASE_URL ?? "") === "") {
    throw new Error(
      "Set DATABASE_URL in the deployment shell to the database URL for this stage"
    );
  }

  if (!/^[a-f0-9]{32}$/iu.test(env.HYPERDRIVE_ID ?? "")) {
    throw new Error(
      "Set HYPERDRIVE_ID to a cache-disabled Hyperdrive config ID; see DEPLOYMENT.md before deploying"
    );
  }

  if ((env.BETTER_AUTH_SECRET ?? "").length < 32) {
    throw new Error(
      "Set BETTER_AUTH_SECRET to at least 32 characters in the deployment shell"
    );
  }

  const origin = env.BETTER_AUTH_URL;

  if (origin !== undefined) {
    const url = URL.parse(origin);

    if (
      url?.protocol !== "https:" ||
      (origin !== url.origin && origin !== `${url.origin}/`)
    ) {
      throw new Error(
        "Set BETTER_AUTH_URL to a public HTTPS origin, or omit it to use the Worker URL"
      );
    }
  }
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

if (action !== "destroy") {
  run(["run", "build"]);
}

if (action === "deploy") {
  run(["run", "db:migrate"]);
}

run([
  "exec",
  "alchemy",
  action,
  "--stage",
  stage,
  ...(action === "deploy" || confirmDestroy ? ["--yes"] : []),
]);
