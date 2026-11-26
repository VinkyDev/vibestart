import type { Context } from "@vibestart/core";
import { contribute, defineIntegration, file } from "@vibestart/core";

import { alchemyProject } from "#/alchemy.ts";
import { containerImageFiles } from "#/docker.ts";
import { templateFiles } from "#/templates.ts";
import {
  rootTypeScriptFiles,
  agentsMap,
  readmeLayers,
  readmeSections,
  readmeTagline,
} from "#/vite-plus/slots.ts";

const cloudRunStack = (ctx: Context) => {
  const database = ctx.has("postgres");

  return `import * as GCP from "@alchemy.run/gcp";
import * as Alchemy from "alchemy";
import type { Layer } from "effect";
import { Config, Effect } from "effect";

import { releaseImage } from "./infra/image.ts";
${database ? 'import { migrate } from "./infra/migration.ts";\n' : ""}
// The beta.87 provider bundle erases its service types. Keep that boundary local.
const providers: Layer.Layer<unknown> = GCP.providers();

export default Alchemy.Stack("${ctx.name}", {
  providers,
  state: GCP.state({ prefix: "cloud-run" }),
}, Effect.gen(function* deploy() {
  const location = yield* Config.String("RUN_REGION");
  const image = yield* releaseImage;

  ${database ? "const migration = yield* migrate(image, location);\n\n  " : ""}const service = yield* GCP.Run.Service("Api", {
    location,
    invokerIamDisabled: true,
    template: {
      ${database ? "serviceAccount: migration.serviceAccount,\n      " : ""}containers: [{
        ${database ? "image: migration.image, env: migration.env," : "image,"}
        ports: [{ containerPort: 3000 }],
        startupProbe: { httpGet: { path: "/api/health", port: 3000 } },
      }],
    },
  });

  return { url: service.uri };
}));
`;
};

const deploymentGuide = (target: string, instructions: readonly string[]) =>
  [
    `# Deploy to ${target} with Alchemy`,
    "Build the generated Dockerfile from the workspace root. Publish a Linux AMD64 image to a registry the runtime can pull from. Use the fully qualified digest reported by Buildx for both preview and production.",
    '```sh\ndocker buildx build --platform linux/amd64 --push --tag "$IMAGE_REPOSITORY:$RELEASE_TAG" .\nexport DEPLOY_IMAGE="$IMAGE_REPOSITORY@sha256:<64 hex digits>"\n```',
    "Set up a GCP profile (`vp exec alchemy profile edit --add GCP`) and bootstrap the shared GCS state bucket once with `vp exec alchemy state bootstrap --backend gcp`. Use the same GCP project, profile and backend on each run. This backend enables uniform bucket access, enforces public access prevention, and grants Storage Object Admin on the bucket to project Owners and Editors. Choose a project whose members may read deployment state. For CI, configure the project's GCP credentials and `GOOGLE_PROJECT_ID`.",
    "Have a state-project administrator run bootstrap with the predefined Storage Admin role (`roles/storage.admin`) on the state project so the same command can create the bucket, configure it and grant object access. For subsequent runs, grant the deployment identity the predefined Storage Admin role (`roles/storage.admin`) on the dedicated state bucket. It covers state objects, bucket and IAM reads, and repairs to uniform access, public access prevention and owner/editor grants. If you design a custom role, restoring public access prevention requires both `storage.buckets.update` and `storage.buckets.setIamPolicy`. See [Cloud Storage API permissions](https://cloud.google.com/storage/docs/access-control/iam-json) and [public access prevention permissions](https://cloud.google.com/storage/docs/using-public-access-prevention).",
    ...instructions,
    "Run `vp run plan`, then `vp run deploy` with the same environment. Both default to stage `prod`. Set `ALCHEMY_STAGE=pr-42` for a preview and keep the target account, region, state backend and stage consistent on redeploy. Check `/api/health` at the printed URL. Use `vp run destroy` with the preview environment to remove its resources. For unattended cleanup pass `vp run destroy --yes` with an explicit `ALCHEMY_STAGE`. The shared state bucket, published image and externally supplied secrets and databases have separate lifecycles.",
  ].join("\n\n");

const containerProject = (
  ctx: Context,
  target: string,
  instructions: readonly string[]
) => [
  ...containerImageFiles(ctx),
  contribute(rootTypeScriptFiles, "infra/*.ts"),
  ...templateFiles(ctx, "cloud-image"),
  contribute(agentsMap, {
    path: "alchemy.run.ts",
    owns: `${target} infrastructure and release configuration`,
  }),
  contribute(readmeTagline, target),
  contribute(readmeLayers, {
    layer: "Deployment",
    choice: `${target} with Alchemy (preview)`,
  }),
  file("DEPLOYMENT.md", `${deploymentGuide(target, instructions)}\n`),
  contribute(
    readmeSections,
    () =>
      `## Production\n\nFollow [the ${target} deployment guide](DEPLOYMENT.md) to publish an image, plan changes and deploy.`
  ),
];

const standalone = {
  mode: ["standard"],
  runtime: ["node"],
  framework: [null],
  api: [null],
  auth: [null],
  desktop: [null],
  mobile: [null],
};

export const cloudRun = defineIntegration({
  id: "gcp-cloud-run",
  kind: "deployment",
  name: "Google Cloud Run (Alchemy)",
  homepage: "https://cloud.google.com/run",
  description: "Deploy a standalone Node API to Google Cloud Run (preview)",
  requires: ["hono-server", "node-runtime"],
  choices: {
    ...standalone,
    api: [null, "openapi"],
    database: [null, "postgres"],
    orm: [null, "drizzle"],
  },
  supportsAdd: true,
  contribute: (ctx) => [
    ...containerProject(ctx, "Google Cloud Run", [
      "Enable the Cloud Run API and set `RUN_REGION`. Grant the deployment identity permission to manage Cloud Run and act as the runtime service account. Grant Cloud Run access to pull the image. The generated service accepts public HTTPS requests on its default URL.",
      ...(ctx.has("postgres")
        ? [
            "Install and authenticate the Google Cloud CLI on the deployment runner. Set `PROD_DATABASE_SECRET` to an existing Secret Manager secret containing the external PostgreSQL connection URL, `PROD_DATABASE_SECRET_VERSION` to its numeric version and `PROD_RUN_SERVICE_ACCOUNT` to a service account with access to that version. Ensure both the job and service can reach the database. The deployment identity needs permission to execute and inspect Cloud Run Jobs. Alchemy updates the migration job, executes it with `--wait`, and updates the serving revision only after success. Use schema changes compatible with the previous revision. For a preview, use a separate database and the corresponding stage prefix, such as `PR_42_DATABASE_SECRET`.",
          ]
        : []),
    ]),
    ...alchemyProject({ providers: ["@alchemy.run/gcp"] }),
    file("alchemy.run.ts", cloudRunStack(ctx)),
    ...(ctx.has("postgres") ? templateFiles(ctx, "cloud-run-postgres") : []),
  ],
});

export const flyMachines = defineIntegration({
  id: "fly-machines",
  kind: "deployment",
  name: "Fly Machines (Alchemy)",
  homepage: "https://fly.io/machines/",
  description: "Deploy a stateless Node API to Fly Machines (preview)",
  requires: ["hono-server", "node-runtime"],
  choices: { ...standalone, database: [null], orm: [null] },
  supportsAdd: true,
  contribute: (ctx) => [
    ...containerProject(ctx, "Fly Machines", [
      "Set `FLY_API_TOKEN`, `FLY_ORG` and `FLY_REGION`. The stack creates an app, a shared IPv4 address and one stateless Machine with HTTPS and an HTTP health check. A public Docker Hub image is one option for a digest accessible to both Fly and Cloud Run. Fly hosts the app and GCS stores deployment state.",
    ]),
    ...alchemyProject({ providers: ["@alchemy.run/fly", "@alchemy.run/gcp"] }),
    ...templateFiles(ctx, "fly-machines"),
  ],
});
