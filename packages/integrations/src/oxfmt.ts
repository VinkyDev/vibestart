import type { OxfmtConfig } from "oxfmt";
import { format } from "oxfmt";
import oxfmt from "ultracite/oxfmt";

type Formatted = ReturnType<typeof format>;

// Stacks share most of their files, so one formatting serves every generation that renders the same file.
const formatted = new WeakMap<OxfmtConfig, Map<string, Formatted>>();

export const formatWithProjectConfig = async (
  path: string,
  content: string,
  scope: string,
  preset: OxfmtConfig = oxfmt
) => {
  let cache = formatted.get(preset);

  if (cache === undefined) {
    cache = new Map();
    formatted.set(preset, cache);
  }

  const key = `${scope}\0${path}\0${content}`;
  const cached = cache.get(key);

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

  cache.set(key, pending);

  return await pending;
};
