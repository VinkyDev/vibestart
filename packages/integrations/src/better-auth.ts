import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
} from "@vibestart/core";

import {
  databaseName,
  devOrigin,
  hasWebApp,
  serverApp,
  serverEnv,
  stackHeadline,
  todosExample,
} from "#/app.ts";
import { composeEnv } from "#/docker.ts";
import { templateContent, templateFiles } from "#/templates.ts";
import {
  agentsConventions,
  agentsMap,
  readmeLayers,
  readmeTagline,
} from "#/vite-plus/slots.ts";

// A full-stack framework that serves auth itself sets cookies from server functions and actions
// only through its plugin; under Hono the plugin would bundle the framework's server into it.
const cookiePlugins = [
  {
    call: "tanstackStartCookies()",
    framework: "tanstack-start",
    statement:
      'import { tanstackStartCookies } from "better-auth/tanstack-start";',
  },
  {
    call: "nextCookies()",
    framework: "next",
    statement: 'import { nextCookies } from "better-auth/next-js";',
  },
];

const renderAuthIndex = (ctx: Context) => {
  const plugin = ctx.has("self")
    ? cookiePlugins.find(({ framework }) => ctx.has(framework))
    : undefined;
  const provider = ctx.has("sqlite") ? "sqlite" : "pg";
  return [
    'import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";',
    'import { betterAuth } from "better-auth";',
    ...(plugin === undefined ? [] : [plugin.statement]),
    "",
    `import type { Database } from "${ctx.scope}/db";`,
    `import * as schema from "${ctx.scope}/db/schema/auth";`,
    ...(ctx.has("electron")
      ? [`import { rendererOrigin } from "${ctx.scope}/electron";`, ""]
      : []),
    "",
    "interface AuthOptions {",
    "  db: Database;",
    "  baseURL: string;",
    "  secret: string;",
    "}",
    "",
    "export const createAuth = ({ db, baseURL, secret }: AuthOptions) =>",
    "  betterAuth({",
    "    baseURL,",
    `    database: drizzleAdapter(db, { provider: "${provider}", schema }),`,
    "    emailAndPassword: { enabled: true },",
    ...(plugin === undefined ? [] : [`    plugins: [${plugin.call}],`]),
    "    secret,",
    ...(ctx.has("electron") ? ["    trustedOrigins: [rendererOrigin],"] : []),
    "  });",
    "",
    "export type Auth = ReturnType<typeof createAuth>;",
    'export type Session = Auth["$Infer"]["Session"];',
    "",
  ].join("\n");
};

// Where signing in lands without a `redirect`: the todos when there are any.
const home = (ctx: Context) => (todosExample(ctx) ? "/todos" : "/");

const protectedPage = (ctx: Context) => {
  const boundary = ctx.has("orpc") ? "the procedure" : "the server route";
  if (ctx.has("next")) {
    return `A page that needs a user calls \`getSession()\` and \`redirect("/login?redirect=…")\` when the session is missing. Add the page to \`redirectTargets\` in \`src/app/login/page.tsx\`; any other redirect value falls back to \`${home(ctx)}\`. The page hide is UX, and ${boundary} is the security boundary.`;
  }
  const guard = todosExample(ctx)
    ? "Put the route under `src/routes/_authenticated/`. The layout sends an anonymous visitor to `/login?redirect=…`."
    : 'The route\'s `beforeLoad` throws `redirect({ to: "/login", search: { redirect: location.href } })` when `context.session` is missing; several such routes share a pathless `_authenticated.tsx` layout that does it once.';
  const layout = `${guard} The session sits on the route context (\`context.session\`), loaded once per navigation in \`__root.tsx\``;
  return ctx.has("spa")
    ? `${layout} from \`/api/auth/get-session\`. This is an SPA: the page hide is UX, and ${boundary} is the security boundary. Sign-out clears the Query cache.`
    : `${layout}. The page hide is UX, and ${boundary} is the security boundary.`;
};

const authorization = (ctx: Context) => {
  if (ctx.has("orpc")) {
    return "A procedure that reads or writes user data is a `protectedProcedure` and scopes every query by `context.session.user.id`. Someone else's row is `NOT_FOUND`, which does not reveal that the id exists. Each new protected procedure gets an integration test as an anonymous caller and as another user.";
  }
  return ctx.has("openapi")
    ? "A route module that reads or writes user data guards its whole sub-app with a session middleware, as `packages/api/src/routes/todos.ts` does: it throws `HTTPException` 401 without a session and sets `c.var.userId`. Each route declares that 401, scopes every query by `c.var.userId`, and answers 404 for someone else's row, which does not reveal that the id exists. Each new protected route gets an integration test as an anonymous caller and as another user."
    : "A server route that reads or writes user data gets the session with `auth.api.getSession({ headers })`, answers 401 without one, and scopes every query by the session's user id. Each new protected route is tested as an anonymous caller and as another user.";
};

const loginPages = {
  next: {
    path: "apps/web/src/app/login/page.tsx",
    set: "better-auth/next",
  },
  "tanstack-router": {
    path: "apps/web/src/routes/login.tsx",
    set: "better-auth/tanstack-router",
  },
} as const;

const loginTemplate = (ctx: Context) =>
  ctx.has("next") ? loginPages.next : loginPages["tanstack-router"];

const loginPage = (ctx: Context) => {
  const { path, set } = loginTemplate(ctx);
  const content = templateContent(ctx, set, path);
  if (todosExample(ctx)) {
    return file(path, content);
  }
  const page = content
    .replace('["/", "/todos"]', '["/"]')
    .replaceAll('"/todos"', '"/"');
  if (page === content) {
    throw new Error(`${set}/${path} has no /todos redirect`);
  }
  return file(path, page);
};

// A full-stack framework either runs Better Auth itself or asks Hono for the session.
const appSets = (ctx: Context) => {
  const server = ctx.has("hono") ? "hono" : "self";
  if (ctx.has("next")) {
    return ["better-auth/next", `better-auth/next-${server}`];
  }
  return ctx.has("tanstack-start")
    ? [`better-auth/tanstack-start-${server}`]
    : ["better-auth/spa"];
};

const webSets = (ctx: Context) => [
  ...appSets(ctx),
  ...(ctx.has("tanstack-router") ? ["better-auth/tanstack-router"] : []),
  ...(ctx.has("tanstack-router") && todosExample(ctx)
    ? ["better-auth/tanstack-router-todos"]
    : []),
];

const webFiles = (ctx: Context) => {
  const login = loginTemplate(ctx);
  return [
    ...webSets(ctx).flatMap((set) =>
      templateFiles(ctx, set, { except: set === login.set ? [login.path] : [] })
    ),
    loginPage(ctx),
  ];
};

export const betterAuth = defineIntegration({
  contribute: (ctx) => [
    ...templateFiles(ctx, "better-auth/common"),
    ...templateFiles(
      ctx,
      `better-auth/${ctx.has("sqlite") ? "sqlite" : "postgres"}`
    ),
    ...(hasWebApp(ctx) ? webFiles(ctx) : []),
    file("packages/auth/src/index.ts", renderAuthIndex(ctx)),
    contribute(packageJson, {
      dependencies: [
        "@better-auth/drizzle-adapter",
        `${ctx.scope}/db`,
        "better-auth",
      ],
      devDependencies: [`${ctx.scope}/config`, "@types/node", "typescript"],
      exports: { ".": "./src/index.ts" },
      imports: { "#src/*": "./src/*" },
      path: "packages/auth",
    }),
    contribute(packageJson, {
      dependencies: [`${ctx.scope}/auth`],
      path: serverApp(ctx).dir,
    }),
    ...(ctx.stack.api === undefined
      ? []
      : [
          contribute(packageJson, {
            dependencies: [`${ctx.scope}/auth`],
            path: "packages/api",
          }),
        ]),
    ...(hasWebApp(ctx)
      ? [
          contribute(packageJson, {
            dependencies: ["better-auth"],
            path: "apps/web",
          }),
        ]
      : []),
    contribute(serverEnv, {
      example: devOrigin(ctx),
      name: "BETTER_AUTH_URL",
      schema: "z.url()",
    }),
    contribute(serverEnv, {
      example: "replace-with-openssl-rand-base64-32-output",
      name: "BETTER_AUTH_SECRET",
      schema: "z.string().min(32)",
    }),
    contribute(composeEnv, {
      name: "BETTER_AUTH_URL",
      value: `\${BETTER_AUTH_URL:-http://localhost:3000}`,
    }),
    contribute(composeEnv, {
      name: "BETTER_AUTH_SECRET",
      value: `\${BETTER_AUTH_SECRET:?set BETTER_AUTH_SECRET}`,
    }),
    contribute(agentsMap, {
      owns: "Better Auth configuration (`createAuth`) and the `Session` type",
      path: "packages/auth",
    }),
    contribute(agentsConventions, {
      text: authorization(ctx),
      title: "Authorization",
    }),
    ...(hasWebApp(ctx)
      ? [
          contribute(agentsConventions, {
            text: protectedPage(ctx),
            title: "Protected page",
          }),
        ]
      : []),
    contribute(agentsConventions, {
      text: "Better Auth rate-limits by client IP. Behind a reverse proxy, set `advanced.ipAddress` in `packages/auth` to the header that proxy sets. With no proxy, leave forwarding headers untrusted.",
      title: "Proxy",
    }),
    contribute(readmeTagline, "Better Auth"),
    contribute(stackHeadline, "Better Auth"),
    contribute(readmeLayers, {
      choice: `Better Auth, email and password, sessions in ${databaseName(ctx)}`,
      layer: "Auth",
    }),
  ],
  id: "better-auth",
  kind: "auth",
  name: "Better Auth",
  description: "Email and password sign-in, with sessions in the database",
  homepage: "https://better-auth.com",
  requires: ["sql-orm"],
});
