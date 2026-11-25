import * as GCP from "@alchemy.run/gcp";
import { Exec } from "alchemy/Command";
import * as Output from "alchemy/Output";
import { Stage } from "alchemy/Stage";
import { Config, Effect } from "effect";

export const migrate = Effect.fn("migrate")(function* migrate(image: string, location: string) {
  const stage = yield* Stage;
  const prefix = stage.toUpperCase().replaceAll("-", "_");
  const secret = yield* Config.String(`${prefix}_DATABASE_SECRET`);
  const version = yield* Config.String(`${prefix}_DATABASE_SECRET_VERSION`);

  if (!/^[1-9]\d*$/u.test(version)) {
    throw new Error("Use a numeric Secret Manager version for the database URL");
  }

  const serviceAccount = yield* Config.String(`${prefix}_RUN_SERVICE_ACCOUNT`);

  const env = [{ name: "DATABASE_URL", valueSource: { secretKeyRef: { secret, version } } }];

  const job = yield* GCP.Run.Job("Migrate", {
    location, serviceAccount, maxRetries: 0, taskCount: 1, parallelism: 1,
    containers: [{ image, env, command: ["node"], args: ["dist/migrate.mjs"] }],
  });

  const execution = yield* Exec("ApplyMigrations", {
    command: Output.interpolate`gcloud run jobs execute ${job.jobId} --project ${job.project} --region ${job.location} --wait --quiet`,
    shell: process.platform === "win32",
    env: { JOB_GENERATION: job.generation, DEPLOY_IMAGE: image, DATABASE_SECRET: secret, DATABASE_SECRET_VERSION: version },
    memo: { include: ["infra/migration.ts"] },
  });

  return { image: execution.hash.pipe(Output.map(() => image)), env, serviceAccount };
});
