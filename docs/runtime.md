# Package manager and runtime

`packageManager` defaults to pnpm. Core renders a pnpm workspace file or Bun workspaces with a catalog and install policy in the root manifest; Bun keeps the `catalog:` protocol and approves install scripts only through an explicit `trustedDependencies`.

The `runtime` kind adds Bun beside Node. Bun needs the Hono capability, so it is legal only in stacks with Hono. Full-stack frameworks and the Vite+ toolchain stay on Node, and Docker includes whichever runtimes the stack uses. Stack names gain `bun` for the runtime and `bun-pm` for the package manager, and a record vouches only for its own fingerprint.

Hono splits `src/app.ts` (routing) from `src/index.ts` (listen and shutdown), so both runtimes load the full module graph and answer requests without binding a socket. `stacks smoke` uses that Node/Bun boundary and never writes records. Workers require workerd and use `stacks verify` in CI.

Expo apps using oRPC keep Expo's default Babel configuration and override its transitive `babel-preset-expo` to `58.0.17` under both package managers. Preset `58.0.18` and `58.0.19` remove the official Hermes async-parameter fixes that oRPC needs. No custom compiler plugin or Babel configuration is added. Remove this override once the default preset passes the iOS and Android native exports in `vp run ready`; other Expo stacks remain unchanged. An existing project can retain Metro's old transform cache after changing the preset: run its mobile build with `--clear` once (`cd apps/mobile && vp run build --clear`).

The e2e runner keeps a parent-owned stdin pipe open, because Vite treats stdin EOF as shutdown outside CI. It installs the catalog's fixed Undici dispatcher and closes it on teardown. Workers SSR receives the same startup readiness budget as Next, because workerd may optimize server dependencies before listening. Worker test servers disable the inspector, avoiding shared debugger ports during parallel verification.

Teardown stops server process trees before removing test databases. Windows uses bounded `taskkill` and exit waits, with direct-child termination if `taskkill` fails; a child that does not exit fails teardown. SQLite removal retries transient file locks.

Workers is an explicit application runtime for Vite + Hono or TanStack Start. Database-backed Workers use a request-scoped client and a cache-disabled Hyperdrive binding to the target database. Node runs the build and migration tools.

Alchemy is an optional infrastructure add-on. It generates a provider-neutral stack with local state. The project owns its resources, provider packages, runtime bindings, database migration order and remote state configuration. Docker independently supplies an image and Compose services.
