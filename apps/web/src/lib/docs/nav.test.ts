import type * as PageTree from "fumadocs-core/page-tree";
import { describe, expect, it } from "vite-plus/test";

import { groupNames, navGroups, neighbours } from "#/lib/docs/nav.ts";

const page = (url: string): PageTree.Item => ({ name: url, type: "page", url });

const tree: PageTree.Root = {
  children: [
    { name: "Start", type: "separator" },
    page("/docs"),
    page("/docs/quick-start"),
    {
      children: [
        page("/docs/concepts/frontend"),
        page("/docs/concepts/database"),
      ],
      index: page("/docs/concepts"),
      name: "Concepts",
      type: "folder",
    },
    { name: "Reference", type: "separator" },
    page("/docs/cli"),
    { name: "Empty", type: "separator" },
  ],
  name: "Docs",
};

describe(navGroups, () => {
  it("groups pages under separators and folders, in order, and drops empty groups", () => {
    expect(
      navGroups(tree).map((group) => [
        group.name,
        group.pages.map((item) => item.url),
      ])
    ).toStrictEqual([
      ["Start", ["/docs", "/docs/quick-start"]],
      [
        "Concepts",
        [
          "/docs/concepts",
          "/docs/concepts/frontend",
          "/docs/concepts/database",
        ],
      ],
      ["Reference", ["/docs/cli"]],
    ]);
  });

  it("keeps pages before any separator in an unnamed group", () => {
    expect(
      navGroups({ children: [page("/docs")], name: "Docs" })
    ).toStrictEqual([
      { name: undefined, pages: [{ name: "/docs", url: "/docs" }] },
    ]);
  });
});

describe(neighbours, () => {
  const groups = navGroups(tree);

  it("reads across groups", () => {
    expect(neighbours(groups, "/docs/concepts/database")).toStrictEqual({
      next: { name: "/docs/cli", url: "/docs/cli" },
      previous: {
        name: "/docs/concepts/frontend",
        url: "/docs/concepts/frontend",
      },
    });
  });

  it("has no neighbour past either end, or for a page not in the tree", () => {
    expect(neighbours(groups, "/docs").previous).toBeUndefined();
    expect(neighbours(groups, "/docs/cli").next).toBeUndefined();
    expect(neighbours(groups, "/docs/missing")).toStrictEqual({
      next: undefined,
      previous: undefined,
    });
  });
});

describe(groupNames, () => {
  it("names each page's group", () => {
    const names = groupNames(navGroups(tree));
    expect(names.get("/docs/concepts/frontend")).toBe("Concepts");
    expect(names.get("/docs/cli")).toBe("Reference");
  });
});
