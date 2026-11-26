import type { Context } from "@vibestart/core";
import { file, renderFile } from "@vibestart/core";

import { hasBackend } from "#/app-shape.ts";
import { todosExample } from "#/example.ts";
import { listStack, stackHeadline } from "#/stack-headline.ts";
import type { StackPart } from "#/stack-headline.ts";
import { templateContent, templateFiles } from "#/templates.ts";

export const clientComponent = (ctx: Context, content: string) =>
  ctx.has("next") ? `"use client";\n\n${content}` : content;

/** Where the API's reference docs are served; a stack without an API has none. */
const apiDocsPath = (ctx: Context) => {
  if (ctx.stack.api === undefined) {
    return null;
  }

  return ctx.has("effect-rpc") ? "/api/docs" : "/api";
};

const homeActions = (ctx: Context, route: boolean) => {
  const docs = apiDocsPath(ctx);

  const todos = todosExample(ctx.stack)
    ? [
        `        <Link ${route ? 'to="/todos"' : 'href="/todos"'} className={buttonVariants({ size: "lg" })}>`,
        "          Try the todo list",
        "        </Link>",
      ]
    : [];

  // The reference is served by the API, outside the app's routes: a plain link, in a tab of its own.
  const reference =
    docs === null
      ? []
      : [
          `        <a href="${docs}" rel="noreferrer" target="_blank" className={buttonVariants({ size: "lg", variant: "outline" })}>`,
          "          Open the API reference",
          "        </a>",
        ];

  return [...todos, ...reference];
};

// Top to bottom, the way a request travels: what the user touches first, what everything rests on last.
const layerOrder = [
  "Mobile",
  "Framework",
  "Frontend",
  "Auth",
  "API",
  "Backend",
  "ORM",
  "Database",
];

const stackLayers = (parts: readonly StackPart[]) => [
  "const layers = [",
  ...parts
    .toSorted((a, b) => layerOrder.indexOf(a.role) - layerOrder.indexOf(b.role))
    .map(
      ({ name, role }) =>
        `  { name: ${JSON.stringify(name)}, role: ${JSON.stringify(role)} },`
    ),
  '  { name: "Vite+", role: "Toolchain" },',
  "];",
  "",
];

const diagramPath = "apps/web/src/components/stack-diagram.tsx";

/** `route` wraps the page in a TanStack file route; otherwise it is a Next.js page. */
export const homePage = (ctx: Context, path: string, route: boolean) => [
  ...templateFiles(ctx, "react/home", { except: [diagramPath] }),
  file(
    diagramPath,
    clientComponent(ctx, templateContent(ctx, "react/home", diagramPath))
  ),
  renderFile(path, (read) => {
    const parts = read(stackHeadline);
    const status = hasBackend(ctx.stack);
    const actions = homeActions(ctx, route);
    const links = todosExample(ctx.stack);

    return [
      ...(route
        ? [
            `import { ${links ? "Link, " : ""}createFileRoute } from "@tanstack/react-router";`,
          ]
        : []),
      ...(!route && links ? ['import Link from "next/link";'] : []),
      ...(route || links ? [""] : []),
      ...(actions.length > 0
        ? [
            `import { buttonVariants } from "${ctx.scope}/ui/components/button";`,
            "",
          ]
        : []),
      ...(status
        ? ['import { ApiStatus } from "#src/components/api-status.tsx";']
        : []),
      'import { StackDiagram } from "#src/components/stack-diagram.tsx";',
      "",
      ...stackLayers(parts),
      "const HomePage = () => (",
      '  <div className="grid items-center gap-12 py-4 lg:min-h-160 lg:grid-cols-2 lg:gap-16">',
      '    <section className="flex flex-col items-start gap-6">',
      ...(status ? ["      <ApiStatus />"] : []),
      '      <h1 className="text-5xl font-semibold tracking-tighter break-words sm:text-7xl">',
      `        ${ctx.name}`,
      "      </h1>",
      '      <p className="text-muted-foreground max-w-md text-lg text-pretty">',
      `        ${listStack(parts)} on Vite+.`,
      "      </p>",
      ...(actions.length > 0
        ? [
            '      <div className="flex flex-wrap gap-3">',
            ...actions,
            "      </div>",
          ]
        : []),
      '      <p className="text-muted-foreground text-sm">',
      `        Start in <code className="text-foreground font-mono break-all">${path}</code>. Run <code className="text-foreground font-mono whitespace-nowrap">vp run ready</code> before you commit.`,
      "      </p>",
      "    </section>",
      "    <StackDiagram layers={layers} />",
      "  </div>",
      ");",
      "",
      ...(route
        ? [
            'export const Route = createFileRoute("/")({',
            "  component: HomePage,",
            "});",
          ]
        : ["export default HomePage;"]),
      "",
    ].join("\n");
  }),
];

const linksPattern =
  /^const links = \[\n(?<entries>(?: {2}.*,\n)+)\] as const;$/mu;

export const navigation = (ctx: Context, set: string, path: string) => {
  const content = templateContent(ctx, set, path);
  const entries = linksPattern.exec(content)?.groups?.entries;

  if (entries === undefined) {
    throw new Error(`${set}/${path} has no links array`);
  }

  const links = entries
    .trimEnd()
    .split("\n")
    .map((line) => line.trim().slice(0, -1))
    .filter((link) => todosExample(ctx.stack) || !link.includes('"/todos"'));

  return file(
    path,
    content.replace(
      linksPattern,
      `const links = [${links.join(", ")}] as const;`
    )
  );
};
