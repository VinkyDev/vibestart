import type { HighlighterCore, ThemedToken } from "shiki/core";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

import type { GeneratedFile } from "@vibestart/core";

import { cached } from "#/lib/cached.ts";

const theme = "vitesse-light";

const grammars = {
  css: async () => await import("shiki/langs/css.mjs"),
  dockerfile: async () => await import("shiki/langs/dockerfile.mjs"),
  html: async () => await import("shiki/langs/html.mjs"),
  json: async () => await import("shiki/langs/json.mjs"),
  jsonc: async () => await import("shiki/langs/jsonc.mjs"),
  markdown: async () => await import("shiki/langs/markdown.mjs"),
  shellscript: async () => await import("shiki/langs/shellscript.mjs"),
  sql: async () => await import("shiki/langs/sql.mjs"),
  tsx: async () => await import("shiki/langs/tsx.mjs"),
  yaml: async () => await import("shiki/langs/yaml.mjs"),
};

type Grammar = keyof typeof grammars;

const byExtension = {
  css: "css",
  html: "html",
  js: "tsx",
  json: "json",
  jsonc: "jsonc",
  md: "markdown",
  mjs: "tsx",
  sh: "shellscript",
  sql: "sql",
  ts: "tsx",
  tsx: "tsx",
  yaml: "yaml",
  yml: "yaml",
} as const satisfies Record<string, Grammar>;

const isExtension = (
  extension: string
): extension is keyof typeof byExtension =>
  Object.hasOwn(byExtension, extension);

const grammarOf = (path: string): Grammar | undefined => {
  const name = path.split("/").at(-1) ?? path;

  if (name === "Dockerfile") {
    return "dockerfile";
  }

  if (name.startsWith("tsconfig") || path.startsWith(".vscode/")) {
    return "jsonc";
  }

  const extension = name.split(".").at(-1) ?? "";

  if (isExtension(extension)) {
    return byExtension[extension];
  }

  return undefined;
};

let highlighter: Promise<HighlighterCore> | undefined;

const loadHighlighter = async () => {
  highlighter ??= createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [],
    themes: [import("shiki/themes/vitesse-light.mjs")],
  });
  const pending = highlighter;

  try {
    return await pending;
  } catch (error) {
    if (highlighter === pending) {
      highlighter = undefined;
    }

    throw error;
  }
};

const tokenize = async ({ content, path }: GeneratedFile) => {
  const shiki = await loadHighlighter();
  const grammar = grammarOf(path);

  if (grammar === undefined) {
    return content
      .split("\n")
      .map((line): ThemedToken[] => [{ content: line, offset: 0 }]);
  }

  if (!shiki.getLoadedLanguages().includes(grammar)) {
    await shiki.loadLanguage(grammars[grammar]());
  }

  return shiki.codeToTokens(content, { lang: grammar, theme }).tokens;
};

const tokenized = new WeakMap<GeneratedFile, Promise<ThemedToken[][]>>();

export const tokensOf = (file: GeneratedFile) =>
  cached(tokenized, file, async () => await tokenize(file));
