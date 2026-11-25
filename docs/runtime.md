# Package manager and runtime

`packageManager` defaults to pnpm. Core renders a pnpm workspace file or Bun workspaces with a catalog and install policy in the root manifest; Bun keeps the `catalog:` protocol and approves install scripts only through an explicit `trustedDependencies`.

The `runtime` kind adds Bun beside Node. Bun needs the Hono capability, so it is legal only in stacks with Hono. Full-stack frameworks and the Vite+ toolchain stay on Node, and Docker includes whichever runtimes the stack uses. Stack names gain `bun` for the runtime and `bun-pm` for the package manager, and a record vouches only for its own fingerprint.

Hono splits `src/app.ts` (routing) from `src/index.ts` (listen and shutdown), so both runtimes load the full module graph and answer requests without binding a socket. `stacks smoke` uses that Node/Bun boundary and never writes records. Workers require workerd and use `stacks verify` in CI.

Expo apps using oRPC keep Expo's default Babel configuration and override its transitive `babel-preset-expo` to `58.0.17` under both package managers. Preset `58.0.18` and `58.0.19` remove the official Hermes async-parameter fixes that oRPC needs. No custom compiler plugin or Babel configuration is added. Remove this override once the default preset passes the iOS and Android native exports in `vp run ready`; other Expo stacks remain unchanged. An existing project can retain Metro's old transform cache after changing the preset: run its mobile build with `--clear` once (`cd apps/mobile && vp run build --clear`).

The e2e runner keeps a parent-owned stdin pipe open, because Vite treats stdin EOF as shutdown outside CI. It installs the catalog's fixed Undici dispatcher and closes it on teardown. Workers SSR receives the same startup readiness budget as Next, because workerd may optimize server dependencies before listening. Worker test servers disable the inspector, avoiding shared debugger ports during parallel verification.

Teardown stops server process trees before removing test databases. Windows uses bounded `taskkill` and exit waits, with direct-child termination if `taskkill` fails; a child that does not exit fails teardown. SQLite removal retries transient file locks.

Alchemy is a deployment integration paired with the auxiliary Workers runtime. It accepts a static SPA, SPA + Hono, or TanStack Start, with optional external PostgreSQL/MySQL + Drizzle and Better Auth. A static SPA deploys as assets with no Worker code. Alchemy runs a Hono Worker before assets only under `/api`, so Hono on Workers serves oRPC at `/api/rpc`. Hono receives request-scoped services through an explicit `createApp(services)` factory; `createApi(services)` remains mandatory. TanStack Start binds services in its global request middleware (`src/start.ts`) and reads them with `getServices()`. The generated app uses Start's default server entry; request services are bound by middleware rather than a custom Worker entry. Clients close on handler failure or after the response body finishes, fails, or is cancelled. Worker stacks enable the `enable_request_signal` compatibility flag, without which `request.signal` never aborts on a client disconnect. Node and Bun outputs retain their module-level services. The Cloudflare Vite plugin builds the Worker. Node migration tools have a separate TypeScript project. The deploy script validates production settings and runs Drizzle migrations. Alchemy binds an existing cache-disabled Hyperdrive ID and uploads the Worker bundle and assets. The migration URL and binding must target the same database.

### Cloudflare deployment verification

Use a disposable Cloudflare account or profile and a separate database for each database-backed project. Give each generated project a unique name so its production stack has its own state. Follow its README to configure credentials, Hyperdrive and Better Auth.

| Generated project               | Check on the URL printed by the first deployment                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static SPA                      | Open a client route directly and reload. Both requests should serve the app and its assets.                                                                               |
| SPA + Hono, PostgreSQL or MySQL | Open a client route, request `/api/health`, sign in and create a todo. Reload immediately and confirm the new todo appears.                                               |
| TanStack Start SSR              | Request a page with JavaScript disabled, then enable JavaScript and complete the sign-in and todo flows. Confirm that logging out prevents access to the protected route. |

Run `vp run deploy` a second time with the same project name, profile and stage. Check that the URL and data persist, and that Alchemy reuses the Worker and the account-level state store. Keep the Hyperdrive configuration's query cache disabled for both deployments.
