import type { Context } from "@vibestart/core";
import { contribute, file, packageJson } from "@vibestart/core";

import type { EnvLine } from "#/env-files.ts";
import { envFiles } from "#/env-files.ts";
import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";

const iconDependencies = contribute(packageJson, {
  dependencies: ["lucide-react-native", "react-native-svg"],
  path: "apps/mobile",
});

const todoMobileFiles = (ctx: Context) => {
  const api = "apps/mobile/src/lib/api.ts";
  const notify = "apps/mobile/src/lib/notify.ts";
  const screen = "apps/mobile/src/app/todos.tsx";

  let apiSource = templateContent(ctx, "expo/effect-todos", api);
  let notifySource = templateContent(ctx, "expo/effect-todos", notify);
  let screenSource = templateContent(ctx, "expo/effect-todos", screen);

  if (!ctx.has("better-auth")) {
    apiSource = replaceOnce(
      apiSource,
      'import { authClient } from "#src/lib/auth-client.ts";\n',
      "",
      api
    );
    apiSource = replaceOnce(
      apiSource,
      `// Native fetch has no cookie jar: Better Auth's Expo client keeps the session, and each request sends it.
const HttpClientLive = FetchHttpClient.layer.pipe(
  Layer.provide(
    Layer.succeed(FetchHttpClient.Fetch, async (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("cookie", await authClient.getCookie());

      return await fetch(input, { ...init, credentials: "omit", headers });
    })
  )
);`,
      `// Native fetch has no browser origin; omit credentials so requests stay stateless.
const HttpClientLive = FetchHttpClient.layer.pipe(
  Layer.provide(
    Layer.succeed(FetchHttpClient.RequestInit, { credentials: "omit" })
  )
);`,
      api
    );

    notifySource = replaceOnce(
      notifySource,
      "TodoNotFound, Unauthorized",
      "TodoNotFound",
      notify
    );
    notifySource = replaceOnce(
      notifySource,
      '  if (error instanceof Unauthorized) {\n    return "Your session has ended. Sign in again.";\n  }\n\n',
      "",
      notify
    );

    screenSource = replaceOnce(screenSource, "RegistryProvider, ", "", screen);
    screenSource = replaceOnce(
      screenSource,
      'import { authClient } from "#src/lib/auth-client.ts";\n',
      "",
      screen
    );
    screenSource = replaceOnce(
      screenSource,
      `const TodosScreen = () => {
  const { data: session } = authClient.useSession();

  if (session === null) {
    return null;
  }

  return (
    <RegistryProvider key={session.session.id}>
      <Todos />
    </RegistryProvider>
  );
};

export default TodosScreen;`,
      "export default Todos;",
      screen
    );
  }

  return [
    file(api, apiSource),
    file(notify, notifySource),
    file(screen, screenSource),
    iconDependencies,
  ];
};

const authMobileFiles = (ctx: Context) => [
  ...templateFiles(ctx, "expo/auth", {
    except: [
      "apps/mobile/src/components/auth-form.tsx",
      "apps/mobile/src/components/user-menu.tsx",
    ],
  }),
  ...templateFiles(ctx, "expo/effect-auth"),
  contribute(packageJson, {
    dependencies: [
      "@better-auth/expo",
      "better-auth",
      "expo-network",
      "expo-secure-store",
      "expo-web-browser",
    ],
    path: "apps/mobile",
  }),
  iconDependencies,
];

export const effectExpo = (ctx: Context, apiUrl: EnvLine) => [
  ...templateFiles(ctx, "expo/backend", {
    except: ["apps/mobile/src/env.ts", "apps/mobile/src/lib/query-client.ts"],
  }),
  ...templateFiles(ctx, "expo/effect"),
  ...(ctx.stack.database === undefined
    ? templateFiles(ctx, "expo/effect-health")
    : todoMobileFiles(ctx)),
  ...(ctx.has("better-auth") ? authMobileFiles(ctx) : []),
  contribute(envFiles, { lines: () => [apiUrl], path: "apps/mobile/.env" }),
  contribute(packageJson, {
    dependencies: ["@effect/atom-react", `${ctx.scope}/contracts`, "effect"],
    path: "apps/mobile",
  }),
];
