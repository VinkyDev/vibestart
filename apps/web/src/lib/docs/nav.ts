import type * as PageTree from "fumadocs-core/page-tree";
import { z } from "zod";

export interface NavPage {
  readonly name: string;
  readonly url: string;
}

export interface NavGroup {
  readonly name: string | undefined;
  readonly pages: readonly NavPage[];
}

const text = z.string();

const pageOf = (item: PageTree.Item): NavPage => ({
  name: text.parse(item.name),
  url: item.url,
});

const pagesIn = (nodes: readonly PageTree.Node[]): NavPage[] =>
  nodes.flatMap((node) => {
    if (node.type === "page") {
      return [pageOf(node)];
    }
    if (node.type === "folder") {
      return [
        ...(node.index ? [pageOf(node.index)] : []),
        ...pagesIn(node.children),
      ];
    }
    return [];
  });

export const navGroups = (tree: PageTree.Root): NavGroup[] => {
  const groups: { name: string | undefined; pages: NavPage[] }[] = [];
  let current: { name: string | undefined; pages: NavPage[] } | undefined;
  for (const node of tree.children) {
    if (node.type === "separator") {
      current = { name: text.parse(node.name), pages: [] };
      groups.push(current);
    } else if (node.type === "folder") {
      groups.push({ name: text.parse(node.name), pages: pagesIn([node]) });
      current = undefined;
    } else if (current === undefined) {
      current = { name: undefined, pages: [pageOf(node)] };
      groups.push(current);
    } else {
      current.pages.push(pageOf(node));
    }
  }
  return groups.filter((group) => group.pages.length > 0);
};

export const groupNames = (groups: readonly NavGroup[]) =>
  new Map(
    groups.flatMap(({ name, pages }) =>
      name === undefined ? [] : pages.map((page) => [page.url, name] as const)
    )
  );

export const neighbours = (groups: readonly NavGroup[], url: string) => {
  const pages = groups.flatMap((group) => group.pages);
  const index = pages.findIndex((page) => page.url === url);
  return index === -1
    ? { next: undefined, previous: undefined }
    : { next: pages[index + 1], previous: pages[index - 1] };
};
