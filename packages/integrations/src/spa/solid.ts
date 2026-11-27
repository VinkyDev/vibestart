import type { Context } from "@vibestart/core";
import { contribute, file, packageJson } from "@vibestart/core";

import { hasBackend } from "#/app-shape.ts";
import { todosExample } from "#/example.ts";
import { todoPageSource } from "#/spa/todo-page.ts";
import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";
import {
  agentsMap,
  readmeTagline,
  unitTestSources,
} from "#/vite-plus/slots.ts";

const entry = (ctx: Context) => {
  const path = "apps/web/src/main.tsx";
  let content = templateContent(ctx, "solid-spa/common", path);

  if (todosExample(ctx.stack)) {
    const about = "<a href={Router.paths.about()}>About</a>";
    content = replaceOnce(
      content,
      about,
      `${about}\n            <a href={Router.paths.todos()}>Todos</a>`,
      path
    );
  }

  if (todosExample(ctx.stack) || ctx.has("better-auth")) {
    content = replaceOnce(
      content,
      "import { Router }",
      [
        'import { Errored, Loading } from "solid-js";',
        ...(ctx.has("better-auth")
          ? ['import { Account } from "#src/account.tsx";']
          : []),
        "import { Router }",
      ].join("\n"),
      path
    );
    content = replaceOnce(
      content,
      "{route.children}",
      '<Errored fallback={() => <main role="alert">Could not load this page. <button type="button" onClick={() => window.location.reload()}>Reload page</button></main>}><Loading fallback={<main role="status">Loading…</main>}>{route.children}</Loading></Errored>',
      path
    );
  }

  if (ctx.has("better-auth")) {
    content = replaceOnce(
      content,
      "<ThemeMenu />",
      '<div class="flex items-center gap-2"><Account /><ThemeMenu /></div>',
      path
    );
  }

  return file(path, content);
};

export const solidSpa = (ctx: Context) => {
  const backend = hasBackend(ctx.stack);
  const todos = "apps/web/src/todos.tsx";

  return [
    ...templateFiles(ctx, "solid-spa/common", {
      except: ["apps/web/src/main.tsx"],
    }),
    entry(ctx),
    ...(todosExample(ctx.stack) && !ctx.has("effect-rpc")
      ? [file(todos, todoPageSource(ctx, "solid-spa/todos", todos))]
      : []),
    ...["index.html", "tsconfig.json", "tsconfig.node.json"].map((name) => {
      const path = `apps/web/${name}`;

      return file(path, templateContent(ctx, "spa/common", path));
    }),
    ...(ctx.has("hono") && !ctx.has("orpc")
      ? templateFiles(ctx, "solid-spa/hono")
      : []),
    file(
      "apps/web/src/home.tsx",
      [
        ...(backend
          ? [
              'import { Loading } from "solid-js";',
              "",
              'import { ApiStatus } from "#src/api-status.tsx";',
              "",
            ]
          : []),
        "export const Home = () => (",
        '  <main class="mx-auto grid max-w-3xl gap-4 px-6 py-16">',
        `    <h1 class="text-4xl font-semibold">${ctx.name}</h1>`,
        "    <p>Solid 2 and UI SDK on Vite+.</p>",
        ...(backend
          ? [
              "    <Loading fallback={<output>Checking API…</output>}><ApiStatus /></Loading>",
            ]
          : []),
        "  </main>",
        ");",
      ].join("\n")
    ),
    contribute(packageJson, {
      path: "apps/web",
      devDependencies: [
        `${ctx.scope}/config`,
        "@solidjs/vite-plugin",
        "@tailwindcss/vite",
        "@types/node",
        "typescript",
        "vite",
        "vite-plus",
      ],
      imports: { "#src/*": "./src/*" },
      scripts: { dev: "vp dev", build: "vp build", preview: "vp preview" },
    }),
    contribute(agentsMap, {
      path: "apps/web",
      owns: "Solid 2 pages, client-side routing and browser tests",
    }),
    contribute(unitTestSources, "apps/web/src"),
    contribute(readmeTagline, "Solid 2"),
  ];
};
