# Deploy to Fly Machines with Alchemy

Build the generated Dockerfile from the workspace root. Publish a Linux AMD64 image to a registry the runtime can pull from. Use the fully qualified digest reported by Buildx for both preview and production.

```sh
docker buildx build --platform linux/amd64 --push --tag "$IMAGE_REPOSITORY:$RELEASE_TAG" .
export DEPLOY_IMAGE="$IMAGE_REPOSITORY@sha256:<64 hex digits>"
```

Set up a GCP profile (`vp exec alchemy profile edit --add GCP`) and bootstrap the shared GCS state bucket once with `vp exec alchemy state bootstrap --backend gcp`. Use the same GCP project, profile and backend on each run. This backend enables uniform bucket access, enforces public access prevention, and grants Storage Object Admin on the bucket to project Owners and Editors. Choose a project whose members may read deployment state. The deployment identity needs state object access and permission to read the bucket IAM policy (storage.buckets.getIamPolicy) on every run and to update it (storage.buckets.setIamPolicy) when those grants are missing. For CI, configure the project's GCP credentials and `GOOGLE_PROJECT_ID`.

Set `FLY_API_TOKEN`, `FLY_ORG` and `FLY_REGION`. The stack creates an app, a shared IPv4 address and one stateless Machine with HTTPS and an HTTP health check. A public Docker Hub image is one option for a digest accessible to both Fly and Cloud Run. Fly hosts the app and GCS stores deployment state.

Run `vp run plan`, then `vp run deploy` with the same environment. Both default to stage `prod`. Set `ALCHEMY_STAGE=pr-42` for a preview and keep the target account, region, state backend and stage consistent on redeploy. Check `/api/health` at the printed URL. Use `vp run destroy` with the preview environment to remove its resources. For unattended cleanup pass `vp run destroy --yes` with an explicit `ALCHEMY_STAGE`. The shared state bucket, published image and externally supplied secrets and databases have separate lifecycles.
