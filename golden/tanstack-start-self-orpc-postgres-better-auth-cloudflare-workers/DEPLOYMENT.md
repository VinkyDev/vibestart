# Deploy to Cloudflare with Alchemy

The root `alchemy.run.ts` deploys to your Cloudflare account. Connect your account with `vp exec alchemy profile edit --add Cloudflare`. For unattended deployments, set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. On first deploy, Alchemy bootstraps an account-wide state Worker, SQLite-backed Durable Object and Secrets Store credentials. See [Cloudflare setup](https://alchemy.run/cloudflare/setup/) and [state store permissions](https://alchemy.run/state-store/).

In the Cloudflare dashboard, create a Hyperdrive connection to the production database with **query caching disabled** so writes and revoked sessions take effect immediately. Export its ID as `HYPERDRIVE_ID` and the matching production database URL as `DATABASE_URL` in the deployment shell. Drizzle migrates this database before upload. The deployed Worker receives only the Hyperdrive binding.

Export `BETTER_AUTH_SECRET` (at least 32 characters). Alchemy uploads it as an encrypted Worker binding and supplies the Worker URL as the auth origin on first deploy. Set `BETTER_AUTH_URL` only to use your own public HTTPS origin.

Run `vp run plan` to inspect changes and `vp run deploy` to apply them. Both default to stage `prod`. Set `ALCHEMY_STAGE=pr-42` for an isolated preview. For previews, prefix database and auth variables with the uppercased stage and an underscore (for example `PR_42_HYPERDRIVE_ID`), using a separate database and secret. Only deploy runs Drizzle. Clean up with `vp run destroy` using the same explicit stage and Cloudflare profile. Use `vp run destroy --yes` for unattended cleanup.
