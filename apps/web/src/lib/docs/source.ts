import type { InferPageType } from "fumadocs-core/source";
import { loader } from "fumadocs-core/source";

import { groupNames, navGroups } from "#/lib/docs/nav.ts";
import { repository } from "#/lib/site.ts";
import { baseLocale, getLocale, locales } from "#/paraglide/runtime.js";
import { docs } from "#source/server.ts";

export const source = loader(docs.toFumadocsSource(), {
  baseUrl: "/docs",
  i18n: {
    defaultLanguage: baseLocale,
    languages: [...locales],
    parser: "dot",
  },
  url: (slugs) => ["/docs", ...slugs].join("/"),
});

export type DocPage = InferPageType<typeof source>;

export const nav = navGroups(source.getPageTree(getLocale()));

export const groupOf = groupNames(nav);

export const docsTarget = (url: string) => {
  const [path = "", hash] = url.split("#");
  return { hash, splat: path.replace(/^\/docs\/?/u, "") };
};

export const sourceUrl = (page: DocPage) =>
  `${repository}/blob/main/apps/web/content/docs/${page.path}`;
