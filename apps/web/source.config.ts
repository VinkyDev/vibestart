import { defineConfig, defineDocs } from "fumadocs-mdx/config";

/**
 * The docs, one MDX file per page and locale: `why.mdx` in English, `why.zh.mdx` in Chinese. Bodies load
 * when a page opens; titles and the sidebar's order load with the app.
 */
export const docs = defineDocs({
  dir: "content/docs",
  docs: { async: true },
});

export default defineConfig({
  mdxOptions: {
    // The theme the Studio's code view paints with, so a snippet reads the same on either page. One theme,
    // painted inline, since the site has no dark mode to switch to.
    rehypeCodeOptions: {
      defaultColor: "light",
      icon: false,
      themes: { light: "vitesse-light" },
    },
  },
});
