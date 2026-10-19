import { spawnSync } from "node:child_process";

if (process.env.DATABASE_URL === undefined || process.env.DATABASE_URL === "") {
  throw new Error(
    "Set DATABASE_URL in the deployment shell to the production database URL"
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

run([
  "exec",
  "--filter",
  "@my-app/web",
  "void",
  "deploy",
  "--platform",
  "cloudflare",
]);
