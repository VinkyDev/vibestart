import { spawnSync } from "node:child_process";

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

run([
  "exec",
  "--filter",
  "@my-app/web",
  "void",
  "deploy",
  "--platform",
  "cloudflare",
]);
