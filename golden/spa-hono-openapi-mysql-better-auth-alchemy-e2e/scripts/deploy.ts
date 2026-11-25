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

if ((process.env.BETTER_AUTH_SECRET ?? "").length < 32) {
  throw new Error(
    "Set BETTER_AUTH_SECRET to at least 32 characters in the deployment shell"
  );
}

const origin = process.env.BETTER_AUTH_URL;

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

run(["run", "build"]);

run(["run", "db:migrate"]);

run(["exec", "alchemy", "deploy", "--stage", "prod", "--yes"]);
