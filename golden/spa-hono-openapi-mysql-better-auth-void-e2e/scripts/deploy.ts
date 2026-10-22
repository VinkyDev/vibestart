import { spawnSync } from "node:child_process";

if (process.env.DATABASE_URL === undefined || process.env.DATABASE_URL === "") {
  throw new Error(
    "Set DATABASE_URL in the deployment shell to the production database URL"
  );
}

if (!/^[a-f0-9]{32}$/iu.test(process.env.HYPERDRIVE_ID ?? "")) {
  throw new Error(
    "Set HYPERDRIVE_ID to a cache-disabled Hyperdrive config ID; see README.md before deploying"
  );
}

const run = (args: string[]) => {
  const result = spawnSync("vp", args, {
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

run(["run", "db:migrate"]);

run(["run", "--filter", "@my-app/web", "build"]);

run([
  "exec",
  "--filter",
  "@my-app/server",
  "void",
  "deploy",
  "--platform",
  "cloudflare",
]);
