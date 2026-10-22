import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
  renderFile,
} from "@vibestart/core";

import {
  hasBackend,
  hasWebApp,
  listStack,
  rpcPath,
  stackHeadline,
  todosExample,
} from "#/app.ts";
import { envFiles } from "#/env-files.ts";
import { quote } from "#/format.ts";
import { knipEntries } from "#/knip.ts";
import { openapiQueriesContent } from "#/openapi.ts";
import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";
import { ultraciteOverrides, ultracitePresets } from "#/ultracite.ts";
import {
  agentsConventions,
  agentsMap,
  agentsNotes,
  generatedFiles,
  readmeLayers,
  readmeOpen,
  readmeTagline,
  rootTypeScriptFiles,
  unitTestSources,
} from "#/vite-plus/slots.ts";

/** A project name is lowercase letters, digits, and dashes from a letter on, so dropping the dashes leaves a valid identifier segment. */
const applicationId = (name: string) => `com.${name.replaceAll("-", "")}.app`;

const renderAppJson = (ctx: Context) =>
  `${JSON.stringify(
    {
      expo: {
        name: ctx.name,
        slug: ctx.name,
        scheme: ctx.name,
        version: "0.0.0",
        orientation: "portrait",
        userInterfaceStyle: "automatic",
        platforms: ["ios", "android"],
        ios: { bundleIdentifier: applicationId(ctx.name) },
        android: { package: applicationId(ctx.name) },
        plugins: [
          "expo-router",
          ...(ctx.has("better-auth") ? ["expo-secure-store"] : []),
        ],
        experiments: { typedRoutes: true, reactCompiler: true },
      },
    },
    null,
    2
  )}\n`;

// Generated files are formatted afterwards, so the renderers below build content, not layout.
const rootLayout = (ctx: Context) => {
  const query = hasBackend(ctx);
  const auth = ctx.has("better-auth");

  const todos = todosExample(ctx)
    ? ['<Stack.Screen name="todos" options={{ title: "Todos" }} />']
    : [];

  const navigation = [
    "<Stack>",
    `<Stack.Screen name="index" options={{ title: ${quote(ctx.name)} }} />`,
    ...(auth && todos.length > 0
      ? ["<Stack.Protected guard={signedIn}>", ...todos, "</Stack.Protected>"]
      : todos),
    ...(auth
      ? [
          "<Stack.Protected guard={!signedIn}>",
          '<Stack.Screen name="login" options={{ title: "Sign in" }} />',
          "</Stack.Protected>",
        ]
      : []),
    "</Stack>",
    '<StatusBar style="auto" />',
  ];

  const tree = [
    "<SafeAreaProvider>",
    ...(query
      ? [
          "<QueryClientProvider client={queryClient}>",
          ...navigation,
          "</QueryClientProvider>",
        ]
      : navigation),
    "</SafeAreaProvider>",
  ];

  return file(
    "apps/mobile/src/app/_layout.tsx",
    [
      'import "../../global.css";',
      ...(query
        ? ['import { QueryClientProvider } from "@tanstack/react-query";']
        : []),
      'import { Stack } from "expo-router";',
      'import { StatusBar } from "expo-status-bar";',
      'import { SafeAreaProvider } from "react-native-safe-area-context";',
      "",
      ...(auth
        ? ['import { authClient } from "#src/lib/auth-client.ts";']
        : []),
      ...(query
        ? ['import { queryClient } from "#src/lib/query-client.ts";', ""]
        : []),
      ...(auth
        ? [
            "const RootLayout = () => {",
            "// The guards decide which screens exist, so they wait for the stored session.",
            "const { data: session, isPending } = authClient.useSession();",
            "",
            "if (isPending) {",
            "return null;",
            "}",
            "",
            "const signedIn = session !== null;",
            "",
            "return (",
            ...tree,
            ");",
            "};",
          ]
        : ["const RootLayout = () => (", ...tree, ");"]),
      "",
      "export default RootLayout;",
      "",
    ].join("\n")
  );
};

// A tappable row; `href` is the attribute's value as written in JSX, a string literal or `{expression}`, and `label` is JSX text.
const linkRow = (href: string, label: string) => [
  `<Link asChild href=${href}>`,
  '<Pressable className="flex-row items-center justify-between active:opacity-60">',
  `<Text className="text-primary font-semibold">${label}</Text>`,
  '<ChevronRight className="text-primary" size={18} />',
  "</Pressable>",
  "</Link>",
];

// Signed out, the home screen offers the sign-in; signed in, the todos when there are any.
const accountCard = (todos: boolean) => [
  "<Card>",
  "<UserMenu />",
  ...(todos
    ? linkRow(
        '{session === null ? "/login" : "/todos"}',
        '{session === null ? "Sign in to keep todos" : "Open your todos"}'
      )
    : ["{session === null && (", ...linkRow('"/login"', "Sign in"), ")}"]),
  "</Card>",
];

const todosCard = [
  "<Card>",
  ...linkRow('"/todos"', "Open the todos"),
  "</Card>",
];

const homeScreen = (ctx: Context) =>
  renderFile("apps/mobile/src/app/index.tsx", (read) => {
    const auth = ctx.has("better-auth");
    const todos = todosExample(ctx);

    const links = auth || todos;

    const listed = listStack(read(stackHeadline));

    const content = [
      '<ScrollView className="bg-background" contentContainerClassName="gap-6 px-5 py-8">',
      '<View className="gap-3">',
      `<Text className="text-4xl font-semibold tracking-tight">${ctx.name}</Text>`,
      `<Text className="text-muted-foreground leading-6">${listed} on Vite+.</Text>`,
      ...(hasBackend(ctx) ? ["<ApiStatus />"] : []),
      "</View>",
      ...(auth ? accountCard(todos) : []),
      ...(!auth && todos ? todosCard : []),
      "</ScrollView>",
    ];

    return [
      ...(links
        ? [
            'import { Link } from "expo-router";',
            'import { ChevronRight } from "lucide-react-native";',
          ]
        : []),
      `import { ${links ? "Pressable, ScrollView, View" : "ScrollView, View"} } from "react-native";`,
      "",
      ...(hasBackend(ctx)
        ? ['import { ApiStatus } from "#src/components/api-status.tsx";']
        : []),
      ...(links ? ['import { Card } from "#src/components/ui/card.tsx";'] : []),
      'import { Text } from "#src/components/ui/text.tsx";',
      ...(auth
        ? [
            'import { UserMenu } from "#src/components/user-menu.tsx";',
            'import { authClient } from "#src/lib/auth-client.ts";',
          ]
        : []),
      "",
      ...(auth
        ? [
            "const Home = () => {",
            "const { data: session } = authClient.useSession();",
            "",
            "return (",
            ...content,
            ");",
            "};",
          ]
        : ["const Home = () => (", ...content, ");"]),
      "",
      "export default Home;",
      "",
    ].join("\n");
  });

const apiUrl = {
  comment: [
    "The API origin of a release build. Leave it empty in development: the app reaches the server",
    "on the machine Metro runs on, at port 3000.",
  ],
  example: "",
  name: "EXPO_PUBLIC_API_URL",
};

const envImport = 'import { apiUrl } from "#src/env.ts";';

// `call` places the session options in the client's constructor call.
const withSession = (
  ctx: Context,
  set: string,
  path: string,
  content: string,
  call: readonly [from: string, to: (options: string) => string]
) => {
  if (!ctx.has("better-auth")) {
    return file(path, content);
  }

  const options = [
    "// Native fetch has no cookie jar: Better Auth's Expo client keeps the session, and each request sends it.",
    'fetch: async (input: RequestInfo | URL, init?: RequestInit) => await fetch(input, { ...init, credentials: "omit" }),',
    "headers: async () => ({ cookie: await authClient.getCookie() }),",
  ].join("\n");

  const where = `${set}/${path}`;

  return file(
    path,
    replaceOnce(
      replaceOnce(
        content,
        envImport,
        `${envImport}\nimport { authClient } from "#src/lib/auth-client.ts";`,
        where
      ),
      call[0],
      call[1](options),
      where
    )
  );
};

const orpcClientPath = "apps/mobile/src/lib/api.ts";

const orpcFiles = (ctx: Context) => [
  file(
    "apps/mobile/babel.config.cjs",
    [
      "module.exports = {",
      "// Hermes rejects the rest-parameter destructuring used by oRPC's client.",
      'plugins: ["@babel/plugin-transform-parameters"],',
      'presets: ["babel-preset-expo"],',
      "};",
      "",
    ].join("\n")
  ),
  ...templateFiles(ctx, "expo/orpc", { except: [orpcClientPath] }),
  withSession(
    ctx,
    "expo/orpc",
    orpcClientPath,
    replaceOnce(
      templateContent(ctx, "expo/orpc", orpcClientPath),
      "/rpc`",
      `${rpcPath(ctx)}\``,
      `expo/orpc/${orpcClientPath}`
    ),
    ["new RPCLink({ ", (options) => `new RPCLink({\n${options}\n`]
  ),
  contribute(packageJson, {
    dependencies: ["@orpc/client", "@orpc/tanstack-query"],
    devDependencies: [
      `${ctx.scope}/api`,
      "@babel/plugin-transform-parameters",
      "babel-preset-expo",
    ],
    path: "apps/mobile",
  }),
];

const openapiQueriesPath = "apps/web/src/lib/api.ts";
const openapiClientPath = "apps/mobile/src/lib/client.ts";

// The queries are the web app's, over a client that reaches the server's origin.
const openapiFiles = (ctx: Context) => [
  file(
    "apps/mobile/src/lib/api.ts",
    replaceOnce(
      openapiQueriesContent(ctx),
      "export const createQueries",
      "const createQueries",
      `openapi/web/${openapiQueriesPath}`
    )
  ),
  withSession(
    ctx,
    "expo/openapi",
    openapiClientPath,
    templateContent(ctx, "expo/openapi", openapiClientPath),
    ["/api`)", (options) => `/api\`, {\n${options}\n})`]
  ),
  contribute(packageJson, {
    dependencies: ["hono"],
    devDependencies: [`${ctx.scope}/api`],
    path: "apps/mobile",
  }),
];

// The app reaches the server at the origin `src/env.ts` resolves. oRPC brings its own typed status; without it the home screen asks `/api/health` directly.
const backendFiles = (ctx: Context) => [
  ...templateFiles(ctx, "expo/backend"),
  ...(ctx.has("orpc") ? orpcFiles(ctx) : templateFiles(ctx, "expo/health")),
  ...(ctx.has("openapi") && todosExample(ctx) ? openapiFiles(ctx) : []),
  contribute(envFiles, { lines: () => [apiUrl], path: "apps/mobile/.env" }),
  contribute(packageJson, {
    dependencies: ["@tanstack/react-query", "zod"],
    path: "apps/mobile",
  }),
];

const formFiles = (ctx: Context) => [
  ...templateFiles(ctx, "expo/form"),
  contribute(packageJson, {
    dependencies: ["class-variance-authority"],
    path: "apps/mobile",
  }),
];

const iconDependencies = contribute(packageJson, {
  dependencies: ["lucide-react-native", "react-native-svg"],
  path: "apps/mobile",
});

const todosScreenPath = "apps/mobile/src/app/todos.tsx";

// A MongoDB todo's id is already a string key.
const todosScreen = (ctx: Context) => {
  const content = templateContent(ctx, "expo/todos", todosScreenPath);

  if (!ctx.has("mongodb")) {
    return file(todosScreenPath, content);
  }

  const keyed = content.replace("String(todo.id)", "todo.id");

  if (keyed === content) {
    throw new Error(`expo/todos/${todosScreenPath} has no numeric key`);
  }

  return file(todosScreenPath, keyed);
};

const todosFiles = (ctx: Context) => [
  ...templateFiles(ctx, "expo/todos", { except: [todosScreenPath] }),
  todosScreen(ctx),
  iconDependencies,
];

// Metro bundles every module `@better-auth/expo/client` imports, expo-network and expo-web-browser among them, though they are optional peers.
const authFiles = (ctx: Context) => [
  ...templateFiles(ctx, "expo/auth"),
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

// `react/style-prop-object` takes expo-status-bar's `style="auto"`, a theme name, for an inline style.
// `@shadcn/lint` reads `src/components/ui` as a design system and forbids appearance classes at call sites, which Uniwind components take.
const lintOverride = (ctx: Context) => `{
  files: ["apps/mobile/**"],
  rules: {
    "react/style-prop-object": ["error", { allow: ["StatusBar"] }],${ctx.has("shadcn") ? '\n    "shadcn/no-restyle": "off",' : ""}
  },
}`;

const sessionSender = (ctx: Context) => {
  if (ctx.has("orpc")) {
    return "`src/lib/api.ts` sends";
  }

  return ctx.has("openapi") && todosExample(ctx)
    ? "`src/lib/client.ts` sends"
    : "a request to the API sends";
};

const devServers = (ctx: Context) => hasWebApp(ctx) || hasBackend(ctx);

const architecture = (ctx: Context) =>
  [
    "The mobile app in `apps/mobile` runs on Expo with Expo Router: each file in `src/app` is a screen, and `_layout.tsx` holds the navigation stack.",
    `\`vp run dev:mobile\` starts Metro and prints a QR code for Expo Go. ${devServers(ctx) ? "It runs beside `vp run dev`, in a terminal of its own, because Expo's terminal UI cannot share one." : "Expo's terminal UI takes the whole terminal."}`,
    ...(hasBackend(ctx)
      ? [
          "The app calls the server at the origin `src/env.ts` resolves: `EXPO_PUBLIC_API_URL` when it is set, otherwise, in development, port 3000 on the machine Metro runs on (`src/lib/api-url.ts`). A release build has no Metro, so it needs `EXPO_PUBLIC_API_URL`.",
        ]
      : []),
    ...(ctx.has("better-auth")
      ? [
          `Better Auth's Expo client (\`src/lib/auth-client.ts\`) keeps the session in SecureStore. Native fetch has no cookie jar, so ${sessionSender(ctx)} the session cookie itself. The server trusts \`${ctx.name}://\`, the app's scheme, as its origin.`,
        ]
      : []),
    "Uniwind compiles Tailwind classes for React Native; the theme is the CSS variables in `apps/mobile/global.css`.",
    `Unit tests run in Node, where \`react-native\` does not load, so they cover logic kept out of components${hasBackend(ctx) ? ", as `src/lib/api-url.test.ts` does" : ""}.`,
    `\`vp run build\` exports the iOS and Android bundles with \`expo export\`. A native module Expo Go does not ship needs a development build: \`vp run --filter ${ctx.scope}/mobile ios\` or \`android\`.`,
  ].join(" ");

export const expo = defineIntegration({
  contribute: (ctx) => [
    ...templateFiles(ctx, "expo/common"),
    ...(hasBackend(ctx) ? backendFiles(ctx) : []),
    ...(ctx.has("better-auth") || todosExample(ctx) ? formFiles(ctx) : []),
    ...(ctx.has("better-auth") ? authFiles(ctx) : []),
    ...(todosExample(ctx) ? todosFiles(ctx) : []),
    rootLayout(ctx),
    file("apps/mobile/app.json", renderAppJson(ctx)),
    file("apps/mobile/.gitignore", ".expo\nexpo-env.d.ts\nios\nandroid\n"),
    homeScreen(ctx),
    contribute(packageJson, {
      dependencies: [
        "cn",
        "expo",
        "expo-constants",
        "expo-linking",
        "expo-router",
        "expo-status-bar",
        "expo-system-ui",
        "react",
        "react-native",
        "react-native-gesture-handler",
        "react-native-reanimated",
        "react-native-safe-area-context",
        "react-native-screens",
        "react-native-worklets",
        "tailwindcss",
        "uniwind",
      ],
      devDependencies: [`${ctx.scope}/config`, "@types/react", "typescript"],
      imports: { "#src/*": "./src/*" },
      main: "expo-router/entry",
      path: "apps/mobile",
      scripts: {
        android: "expo run:android",
        build: "expo export --platform ios --platform android",
        ios: "expo run:ios",
        start: "expo start",
      },
    }),
    contribute(packageJson, {
      path: ".",
      scripts: { "dev:mobile": `vp run --filter ${ctx.scope}/mobile start` },
    }),
    // Without `updates.enabled: false` in `app.json`, Knip's Expo plugin expects `expo-updates`. Turning updates off would trip up a later EAS Update.
    contribute(knipEntries, {
      ignoreDependencies: ["expo-updates"],
      workspace: "apps/mobile",
    }),
    contribute(ultracitePresets, {
      module: "ultracite/oxlint/react",
      name: "react",
    }),
    contribute(ultraciteOverrides, lintOverride(ctx)),
    contribute(generatedFiles, {
      glob: "apps/mobile/uniwind-types.d.ts",
      label: "apps/mobile/uniwind-types.d.ts",
      note: "Metro rewrites it from the themes in `global.css`.",
    }),
    // Metro loads its config in Node, outside the React Native preset `apps/mobile/tsconfig.json` checks.
    contribute(rootTypeScriptFiles, "apps/mobile/metro.config.ts"),
    contribute(unitTestSources, "apps/mobile/src"),
    contribute(stackHeadline, "Expo"),
    contribute(agentsMap, {
      owns: "Expo Router screens, mobile UI components, and the Uniwind theme",
      path: "apps/mobile",
    }),
    contribute(agentsNotes, architecture(ctx)),
    contribute(agentsConventions, {
      text: "Add a screen as a file in `apps/mobile/src/app`. Style React Native components with Tailwind classes in `className`, and reuse the components in `apps/mobile/src/components/ui`.",
      title: "Mobile",
    }),
    ...(ctx.has("better-auth")
      ? [
          contribute(agentsConventions, {
            text: "A screen that needs a user is listed under a `Stack.Protected guard={signedIn}` in `apps/mobile/src/app/_layout.tsx`. The guard is UX, and the server is the security boundary.",
            title: "Protected screen",
          }),
        ]
      : []),
    contribute(readmeTagline, "Expo"),
    contribute(readmeLayers, {
      choice: "Expo SDK 58 with Expo Router and Uniwind (Tailwind CSS 4)",
      layer: "Mobile",
    }),
    contribute(
      readmeOpen,
      `\`vp run dev:mobile\` prints a QR code: scan it with Expo Go on a phone on the same network as this machine, or press \`i\` or \`a\` for a simulator.${hasBackend(ctx) ? " The app reaches the server on port 3000 of this machine, so let the firewall pass it; a release build takes the server's origin from `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`." : ""}`
    ),
  ],
  id: "expo",
  kind: "mobile",
  name: "Expo",
  description: "iOS and Android app on React Native, with Expo Router",
  homepage: "https://expo.dev",
  // No requirement: a mobile app alone is a legal stack, as a static single-page app is.
});
