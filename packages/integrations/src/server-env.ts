import { existsSync, globSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export interface MaterializeEnvOptions {
  readonly authSecret?: string;
  /** Replaces a `postgres://…` `DATABASE_URL` (stack verification uses the runner's Postgres). */
  readonly postgresDatabaseUrl?: string;
  readonly overwrite?: boolean;
}

export const materializeEnvFromExamples = (
  projectRoot: string,
  {
    authSecret,
    overwrite = true,
    postgresDatabaseUrl,
  }: MaterializeEnvOptions = {}
) => {
  for (const example of globSync("apps/*/.env.example", {
    cwd: projectRoot,
  })) {
    const target = path.join(projectRoot, example.replace(/\.example$/u, ""));
    if (!overwrite && existsSync(target)) {
      continue;
    }
    let env = readFileSync(path.join(projectRoot, example), "utf-8");
    if (authSecret !== undefined) {
      env = env.replace(
        /^BETTER_AUTH_SECRET=.*$/mu,
        `BETTER_AUTH_SECRET=${authSecret}`
      );
    }
    if (postgresDatabaseUrl !== undefined) {
      env = env.replace(
        /^DATABASE_URL=postgres:.*$/mu,
        `DATABASE_URL=${postgresDatabaseUrl}`
      );
    }
    writeFileSync(target, env);
  }
};
