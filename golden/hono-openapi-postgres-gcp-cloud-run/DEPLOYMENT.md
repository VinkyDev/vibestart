# Deploy to Google Cloud Run with Alchemy

Build the generated Dockerfile from the workspace root. Publish a Linux AMD64 image to a registry the runtime can pull from. Use the fully qualified digest reported by Buildx for both preview and production.

```sh
docker buildx build --platform linux/amd64 --push --tag "$IMAGE_REPOSITORY:$RELEASE_TAG" .
export DEPLOY_IMAGE="$IMAGE_REPOSITORY@sha256:<64 hex digits>"
```

Set up a GCP profile (`vp exec alchemy profile edit --add GCP`) and bootstrap the shared GCS state bucket once with `vp exec alchemy state bootstrap --backend gcp`. Use the same GCP project, profile and backend on each run. This backend enables uniform bucket access, enforces public access prevention, and grants Storage Object Admin on the bucket to project Owners and Editors. Choose a project whose members may read deployment state. For CI, configure the project's GCP credentials and `GOOGLE_PROJECT_ID`.

Have a state-project administrator run bootstrap with the predefined Storage Admin role (`roles/storage.admin`) on the state project so the same command can create the bucket, configure it and grant object access. For subsequent runs, grant the deployment identity the predefined Storage Admin role (`roles/storage.admin`) on the dedicated state bucket. It covers state objects, bucket and IAM reads, and repairs to uniform access, public access prevention and owner/editor grants. If you design a custom role, restoring public access prevention requires both `storage.buckets.update` and `storage.buckets.setIamPolicy`. See [Cloud Storage API permissions](https://cloud.google.com/storage/docs/access-control/iam-json) and [public access prevention permissions](https://cloud.google.com/storage/docs/using-public-access-prevention).

Enable the Cloud Run API and set `RUN_REGION`. Grant the deployment identity permission to manage Cloud Run and act as the runtime service account. Grant Cloud Run access to pull the image. The generated service accepts public HTTPS requests on its default URL.

Install and authenticate the Google Cloud CLI on the deployment runner. Set `PROD_DATABASE_SECRET` to an existing Secret Manager secret containing the external PostgreSQL connection URL, `PROD_DATABASE_SECRET_VERSION` to its numeric version and `PROD_RUN_SERVICE_ACCOUNT` to a service account with access to that version. Ensure both the job and service can reach the database. The deployment identity needs permission to execute and inspect Cloud Run Jobs. Alchemy updates the migration job, executes it with `--wait`, and updates the serving revision only after success. Use schema changes compatible with the previous revision. For a preview, use a separate database and the corresponding stage prefix, such as `PR_42_DATABASE_SECRET`.

Run `vp run plan`, then `vp run deploy` with the same environment. Both default to stage `prod`. Set `ALCHEMY_STAGE=pr-42` for a preview and keep the target account, region, state backend and stage consistent on redeploy. Check `/api/health` at the printed URL. Use `vp run destroy` with the preview environment to remove its resources. For unattended cleanup pass `vp run destroy --yes` with an explicit `ALCHEMY_STAGE`. The shared state bucket, published image and externally supplied secrets and databases have separate lifecycles.
