import type { OxfmtConfig } from "oxfmt";
import { format } from "oxfmt";
import oxfmt from "ultracite/oxfmt";

type Formatted = ReturnType<typeof format>;

// Stacks share most of their files, so one formatting serves every generation that renders the same file.
const formatted = new Map<string, Formatted>();

export const formatWithProjectConfig = async (
  path: string,
  content: string,
  scope: string,
  preset: OxfmtConfig = oxfmt
) => {
  // The options themselves, not the preset object, so a preset changed between calls is formatted afresh.
  const key = JSON.stringify([preset, scope, path, content]);
  const cached = formatted.get(key);

  if (cached !== undefined) {
    return await cached;
  }

  // CLI-only ignores are handled by the generator before it calls the native formatter.
  const { ignorePatterns: _ignorePatterns, ...options } = preset;

  const pending = format(path, content, {
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

  formatted.set(key, pending);

  try {
    return await pending;
  } catch (error) {
    formatted.delete(key);
    throw error;
  }
};
