import {
  createFileRoute,
  getRouteApi,
  notFound,
  redirect,
} from "@tanstack/react-router";
import { AnchorProvider } from "fumadocs-core/toc";
import { ArrowLeft, ArrowRight, SquarePen } from "lucide-react";

import { cn } from "@vibestart/ui/lib/utils";

import { DocLink } from "#/components/docs/doc-link.tsx";
import { mdxComponents } from "#/components/docs/mdx.tsx";
import { MobileNav } from "#/components/docs/sidebar.tsx";
import { Toc } from "#/components/docs/toc.tsx";
import { NotFound, notFoundAction } from "#/components/not-found.tsx";
import type { NavPage } from "#/lib/docs/nav.ts";
import { neighbours } from "#/lib/docs/nav.ts";
import { groupOf, nav, source, sourceUrl } from "#/lib/docs/source.ts";
import { m } from "#/paraglide/messages.js";
import { getLocale } from "#/paraglide/runtime.js";

const route = getRouteApi("/_docs/docs/$");

const Neighbour = ({
  direction,
  page,
}: {
  readonly direction: "next" | "previous";
  readonly page: NavPage | undefined;
}) =>
  page === undefined ? (
    <span />
  ) : (
    <DocLink
      className={cn(
        "bg-card shadow-rest hover:shadow-lift group flex flex-col gap-1 rounded-xl px-5 py-4 transition-shadow",
        direction === "next" && "items-end text-right"
      )}
      url={page.url}
    >
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {direction === "previous" && (
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
        )}
        {direction === "next" ? m.docs_next() : m.docs_previous()}
        {direction === "next" && (
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        )}
      </span>
      <span className="font-medium">{page.name}</span>
    </DocLink>
  );

const DocPage = () => {
  const { body: Body, page, toc } = route.useLoaderData();
  const { next, previous } = neighbours(nav, page.url);
  const group = groupOf.get(page.url);

  return (
    <AnchorProvider single toc={toc}>
      <main className="flex min-w-0 flex-1 flex-col">
        <MobileNav title={page.data.title} />
        <div className="flex flex-1 justify-center gap-10 xl:gap-14">
          <article className="w-full max-w-[46rem] min-w-0 px-5 pt-10 pb-24 sm:px-8 lg:pt-12">
            <header className="border-border mb-10 flex flex-col gap-4 border-b pb-9">
              {group !== undefined && (
                <p className="text-muted-foreground text-sm">{group}</p>
              )}
              <h1 className="font-headline text-display sm:text-title text-balance">
                {page.data.title}
              </h1>
              {page.data.description !== undefined && (
                <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
                  {page.data.description}
                </p>
              )}
            </header>

            <div className="text-foreground/85 text-prose [&>h2:first-child]:mt-0 [&>h2:first-child]:border-t-0 [&>h2:first-child]:pt-0">
              <Body components={mdxComponents} />
            </div>

            <footer className="mt-20 flex flex-col gap-6">
              <a
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 self-start text-sm transition-colors"
                href={sourceUrl(page)}
                rel="noreferrer"
                target="_blank"
              >
                <SquarePen className="size-4" strokeWidth={1.75} />
                {m.docs_edit()}
              </a>
              <nav
                aria-label={m.docs_pagination()}
                className="grid gap-3 sm:grid-cols-2"
              >
                <Neighbour direction="previous" page={previous} />
                <Neighbour direction="next" page={next} />
              </nav>
            </footer>
          </article>
          <Toc toc={toc} />
        </div>
      </main>
    </AnchorProvider>
  );
};

const PageNotFound = () => (
  <NotFound>
    <DocLink className={notFoundAction.primary} url="/docs">
      {m.docs_back_home()}
    </DocLink>
  </NotFound>
);

// Published page URLs keep pointing to the section that now owns their content.
const relocatedPages = new Map([
  ["concepts/frontend", "stack/frontend#choose"],
  ["concepts/backend", "stack/backend#choose"],
  ["concepts/database", "stack/data#drizzle"],
  ["concepts/auth", "stack/data#better-auth"],
  ["concepts/testing", "testing"],
  ["concepts/deployment", "stack/delivery#docker"],
  ["concepts/engineering", "stack/toolchain#vite-plus"],
]);
// The first page once held why vibestart exists and how it tests; those sections have pages of their own.
const introductionSections = new Map([
  ["conventions", "why#conventions"],
  ["maintenance", "why#maintenance"],
  ["testing", "testing#principles"],
  ["typescript", "why#typescript"],
  ["verification", "why#verification"],
]);
const creationSections = new Set([
  "interactive",
  "kinds",
  "illegal",
  "runtime",
  "addons",
  "options",
  "recipe",
  "dry-run",
  "json",
  "errors",
  "exit-codes",
  "steps",
]);

export const Route = createFileRoute("/_docs/docs/$")({
  component: DocPage,
  beforeLoad: ({ params, location }) => {
    const slug = params._splat?.replace(/\/$/u, "") ?? "";
    let target = relocatedPages.get(slug);
    if (slug === "") {
      target = introductionSections.get(location.hash);
    }
    if (slug === "cli" && creationSections.has(location.hash)) {
      target = `cli/create#${location.hash}`;
    }
    if (slug === "cli" && location.hash === "maintenance") {
      target = "cli#workflow";
    }
    if (target !== undefined) {
      const [next = "", hash] = target.split("#");
      throw redirect({
        to: "/docs/$",
        params: { _splat: next },
        hash,
        replace: true,
      });
    }
  },
  loader: async ({ params }) => {
    const page = source.getPage(
      params._splat?.split("/").filter(Boolean),
      getLocale()
    );
    if (page === undefined) {
      throw notFound();
    }
    const { body, toc } = await page.data.load();
    return { body, page, toc };
  },
  head: ({ loaderData }) => ({
    meta:
      loaderData === undefined
        ? []
        : [
            {
              title: m.docs_document_title({
                page: loaderData.page.data.title,
              }),
            },
            {
              content: loaderData.page.data.description,
              name: "description",
            },
          ],
  }),
  notFoundComponent: PageNotFound,
});
