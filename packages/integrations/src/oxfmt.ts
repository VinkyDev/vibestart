import type { OxfmtConfig } from "oxfmt";
import { format } from "oxfmt";
import oxfmt from "ultracite/oxfmt";

export const formatWithProjectConfig = async (
  path: string,
  content: string,
  scope: string,
  preset: OxfmtConfig = oxfmt
) => {
  // CLI-only ignores are handled by the generator before it calls the native formatter.
  const { ignorePatterns: _ignorePatterns, ...options } = preset;
  return await format(path, content, {
    ...options,
    proseWrap: "preserve",
    sortImports: {
      customGroups: [
        { elementNamePattern: [`${scope}/**`], groupName: "workspace" },
      ],
      groups: [
        "builtin",
        "external",
        "workspace",
        ["internal", "subpath"],
        ["parent", "sibling", "index"],
        "style",
        "unknown",
      ],
      ignoreCase: true,
      newlinesBetween: true,
      order: "asc",
    },
  });
};
