import type { Context } from "@vibestart/core";

export const effectConventions = (ctx: Context) => [
  {
    title: "Effect",
    text: 'Services are `Context.Service` classes with static layers. Compose them with `Layer` and run them at process or Promise boundaries. Use `Effect.gen` for inline programs and layer construction, `Effect.fn("Service.operation")` for reusable operations, and `Effect.fnUntraced` when a span would duplicate an existing boundary. Internal failures can use `Data.TaggedError`; public errors use `Schema.TaggedError` in `packages/contracts`. Map expected failures at the transport boundary and log their causes there. Reserve defects for broken invariants in application flows; do not turn database or authentication outages into defects with `Effect.orDie`. Test-cleanup finalizers may use `Effect.orDie` because scope finalizers cannot return typed errors. Every `effect` and `@effect/*` package stays on one exact version.',
  },
  {
    title: "Environment",
    text: "Read server variables with `Config` where the service that needs them builds its layer (for example, `PORT` in `apps/server/src/index.ts`), and list each, with a safe example value, under Environment in `README.md`. Secrets are `Config.Redacted`. Keep real values in the ignored `.env` file. The web app is shipped to the browser, so it holds no secret.",
  },
  {
    title: "Procedure",
    text: "Declare it with `Rpc.make` on an RPC group in `packages/contracts`, with payload, success, and error schemas, then implement it in the group's `toLayer` in `packages/api`. The server decodes the payload with the same schema; the web form decodes it first, so a user sees the rule before a request is sent. Public REST endpoints go on `Api` in `src/http-api.ts` instead.",
  },
  ...(ctx.stack.database === undefined
    ? []
    : [
        {
          title: "Schema",
          text: [
            "Add or edit a table in `packages/db/src/schema/`, register a new table in `src/relations.ts`, and back each invariant with a constraint (`check`, `unique`, foreign keys) as well as the contract schema. Run `vp run db:generate` and commit the new folder under `src/migrations/`. A committed migration stays as generated.",
            ...(ctx.has("sqlite")
              ? [
                  'SQLite stores booleans and timestamps as integers (`integer({ mode: "boolean" })`, `integer({ mode: "timestamp_ms" })`). Queries and migrations use Drizzle’s native Effect driver; yield them inside Effect programs. `DATABASE_URL` is a filesystem path relative to the process working directory: `local.db` resolves to `apps/server/local.db` for the generated server and migration commands.',
                ]
              : []),
            ...(ctx.has("better-auth")
              ? [
                  "The Better Auth tables in `schema/auth.ts` match the fields Better Auth expects; read its docs before adding a plugin.",
                ]
              : []),
          ].join(" "),
        },
      ]),
  ...(ctx.has("better-auth")
    ? [
        {
          title: "Authorization",
          text: "A group that reads or writes user data carries `.middleware(AuthMiddleware)`, and its RPC handlers pass `CurrentUser.id` to a service that scopes every query by that user. Someone else's row is a `TodoNotFound`-style error, which does not reveal that the id exists. Each new procedure gets an integration test as an anonymous caller and as another user.",
        },
        {
          title: "Protected page",
          text: "Put the route under `src/routes/_authenticated/`. The layout sends an anonymous visitor to `/login?redirect=\u2026`. The session sits on the route context (`context.session`), loaded once per navigation in `__root.tsx` from `/api/auth/get-session`. This is an SPA: the page hide is UX, and the procedure is the security boundary. Authenticated routes own a `RegistryProvider` keyed by session ID; sign-out or session replacement disposes private state without resetting public queries. The root observes Better Auth session changes and invalidates router context when the session ID changes.",
        },
      ]
    : []),
  {
    title: "Data in the UI",
    text: "Read with `Rpc.query` / `HttpApi.query` atoms and `useAtomSuspense` or `useAtomValue`. Use `Rpc.mutation` for one shared write, such as the create form. Independent row writes use `Atom.family` with `Rpc.runtime.fn`, so one row cannot interrupt another. Refresh queries through `reactivityKeys` or `Reactivity.mutation`, disable repeated writes to the same row while pending, and report failed exits to the user.",
  },
  ...(ctx.has("better-auth")
    ? [
        {
          title: "Proxy",
          text: "Better Auth rate-limits by client IP. Behind a reverse proxy, set `advanced.ipAddress` in `packages/auth` to the header that proxy sets. With no proxy, leave forwarding headers untrusted.",
        },
      ]
    : []),
];
