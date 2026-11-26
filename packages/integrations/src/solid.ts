import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
} from "@vibestart/core";

import { todosExample } from "#/app.ts";
import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";
import { readmeLayers } from "#/vite-plus/slots.ts";

export const solid = defineIntegration({
  id: "solid",
  kind: "frontend",
  name: "Solid 2",
  description: "Fine-grained reactive components with Solid 2",
  homepage: "https://www.solidjs.com",
  provides: ["solid"],
  requires: ["frontend-framework", "ui-components"],
  contribute: (ctx) => [
    ...templateFiles(ctx, "solid/common"),
    contribute(packageJson, {
      path: "apps/web",
      dependencies: ["solid-js", "@solidjs/web"],
    }),
    contribute(readmeLayers, {
      layer: "Frontend",
      choice: "Solid 2 with the Solid JSX compiler",
    }),
  ],
});

const router = (ctx: Context) => {
  const path = "apps/web/src/router.tsx";
  const template = templateContent(ctx, "solid-router/common", path);

  const pages = [
    ...(ctx.has("better-auth")
      ? [{ path: "login", component: "Login", module: "login" }]
      : []),
    ...(todosExample(ctx)
      ? [
          {
            path: "todos",
            component: ctx.has("better-auth") ? "ProtectedTodos" : "Todos",
            module: ctx.has("better-auth") ? "protected-todos" : "todos",
          },
        ]
      : []),
  ];

  const homeImport = 'import { Home } from "#src/home.tsx";';
  const homeRoute = '    { path: "/", component: Home },';

  const withImports = replaceOnce(
    template,
    homeImport,
    [
      homeImport,
      ...pages.map(
        (page) => `import { ${page.component} } from "#src/${page.module}.tsx";`
      ),
    ].join("\n"),
    path
  );

  return file(
    path,
    replaceOnce(
      withImports,
      homeRoute,
      [
        homeRoute,
        ...pages.map(
          (page) =>
            `    { path: "/${page.path}", component: ${page.component} },`
        ),
      ].join("\n"),
      path
    )
  );
};

export const solidRouter = defineIntegration({
  id: "solid-router",
  kind: "router",
  name: "Solid Router",
  description: "Typed client-side routing for Solid 2",
  homepage: "https://docs.solidjs.com/routing/solid-router/setup/",
  provides: ["router"],
  requires: ["solid"],
  contribute: (ctx) => [
    router(ctx),
    contribute(packageJson, {
      path: "apps/web",
      dependencies: ["@solidjs/router"],
    }),
  ],
});
