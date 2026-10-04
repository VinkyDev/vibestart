import { initAdvancedSearch } from "fumadocs-core/search/server";

import { groupOf, source } from "#/lib/docs/source.ts";
import { getLocale } from "#/paraglide/runtime.js";

const server = initAdvancedSearch({
  indexes: async () =>
    await Promise.all(
      source.getPages(getLocale()).map(async (page) => {
        const group = groupOf.get(page.url);
        const { structuredData } = await page.data.load();
        return {
          breadcrumbs: group === undefined ? [] : [group],
          description: page.data.description,
          id: page.url,
          structuredData,
          title: page.data.title,
          url: page.url,
        };
      })
    ),
});

export const searchDocs = async (query: string) =>
  await server.search(query, { limit: 24 });
