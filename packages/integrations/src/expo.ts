import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
  renderFile,
} from "@vibestart/core";

import { hasBackend, hasWebApp, stackHeadline } from "#/app.ts";
import { quote } from "#/format.ts";
import { knipEntries } from "#/knip.ts";
import { templateFiles } from "#/templates.ts";
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
        plugins: ["expo-router"],
        experiments: { typedRoutes: true, reactCompiler: true },
      },
    },
    null,
    2
  )}\n`;

// Generated files are formatted afterwards, so the renderers below build content, not layout.
const rootLayout = (ctx: Context) => {
  const query = hasBackend(ctx);
  const navigation = [
    "<Stack>",
    `<Stack.Screen name="index" options={{ title: ${quote(ctx.name)} }} />`,
    "</Stack>",
    '<StatusBar style="auto" />',
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
      ...(query
        ? ['import { queryClient } from "#src/lib/query-client.ts";', ""]
        : []),
      "const RootLayout = () => (",
      "<SafeAreaProvider>",
      ...(query
        ? [
            "<QueryClientProvider client={queryClient}>",
            ...navigation,
            "</QueryClientProvider>",
          ]
        : navigation),
      "</SafeAreaProvider>",
      ");",
      "",
      "export default RootLayout;",
      "",
    ].join("\n")
  );
};

const homeScreen = (ctx: Context) =>
  renderFile("apps/mobile/src/app/index.tsx", (read) =>
    [
      'import { ScrollView } from "react-native";',
      "",
      ...(hasBackend(ctx)
        ? ['import { ApiStatus } from "#src/components/api-status.tsx";']
        : []),
      'import { Card } from "#src/components/ui/card.tsx";',
      'import { Text } from "#src/components/ui/text.tsx";',
      "",
      "const Home = () => (",
      '<ScrollView className="bg-background" contentContainerClassName="gap-4 p-4">',
      "<Card>",
      `<Text className="text-2xl font-semibold">${ctx.name}</Text>`,
      `<Text className="text-muted-foreground">${read(stackHeadline).join(" · ")}</Text>`,
      ...(hasBackend(ctx) ? ["<ApiStatus />"] : []),
      "</Card>",
      "</ScrollView>",
      ");",
      "",
      "export default Home;",
      "",
    ].join("\n")
  );

const envExample = [
  "# The API origin of a release build. Leave it empty in development: the app reaches the server",
  "# on the machine Metro runs on, at port 3000.",
  "EXPO_PUBLIC_API_URL=",
  "",
].join("\n");

const orpcFiles = (ctx: Context) => [
  ...templateFiles(ctx, "expo/orpc"),
  contribute(packageJson, {
    dependencies: ["@orpc/client", "@orpc/tanstack-query"],
    devDependencies: [`${ctx.scope}/api`],
    path: "apps/mobile",
  }),
];

// The app reaches the server at the origin `src/env.ts` resolves. oRPC brings its own typed status; without it the home screen asks `/api/health` directly.
const backendFiles = (ctx: Context) => [
  ...templateFiles(ctx, "expo/backend"),
  ...(ctx.has("orpc") ? orpcFiles(ctx) : templateFiles(ctx, "expo/health")),
  file("apps/mobile/.env.example", envExample),
  contribute(packageJson, {
    dependencies: ["@tanstack/react-query", "zod"],
    path: "apps/mobile",
  }),
];

// `react/style-prop-object` takes expo-status-bar's `style="auto"`, a theme name, for an inline style.
// `@shadcn/lint` reads `src/components/ui` as a design system and forbids appearance classes at call sites, which Uniwind components take.
const lintOverride = (ctx: Context) => `{
  files: ["apps/mobile/**"],
  rules: {
    "react/style-prop-object": ["error", { allow: ["StatusBar"] }],${ctx.has("shadcn") ? '\n    "shadcn/no-restyle": "off",' : ""}
  },
}`;

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
    "Uniwind compiles Tailwind classes for React Native; the theme is the CSS variables in `apps/mobile/global.css`.",
    `\`vp run build\` exports the iOS and Android bundles with \`expo export\`. A native module Expo Go does not ship needs a development build: \`vp run --filter ${ctx.scope}/mobile ios\` or \`android\`.`,
  ].join(" ");

export const expo = defineIntegration({
  contribute: (ctx) => [
    ...templateFiles(ctx, "expo/common"),
    ...(hasBackend(ctx) ? backendFiles(ctx) : []),
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
