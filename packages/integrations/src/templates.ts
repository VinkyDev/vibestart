import type { Context, Contribution } from "@vibestart/core";
import { file } from "@vibestart/core";

const root = "../templates/";

// Vite's glob skips dot-files and dot-directories, so templates hold none; dot-files are rendered in TypeScript.
const templates = import.meta.glob<string>("../templates/**", {
  eager: true,
  import: "default",
  query: "?raw",
});

export const templatePaths = Object.keys(templates).map((key) =>
  key.slice(root.length)
);

// Templates are verbatim files of a project named `my-app`.
const withName = (ctx: Context, content: string) =>
  content.replaceAll("my-app", ctx.name);

export const templateContent = (ctx: Context, set: string, path: string) => {
  const content = templates[`${root}${set}/${path}`];
  if (content === undefined) {
    throw new Error(`Template ${set}/${path} does not exist`);
  }
  return withName(ctx, content);
};

/** `move` replaces a leading path prefix. */
export const templateFiles = (
  ctx: Context,
  set: string,
  {
    except = [],
    move,
  }: {
    except?: readonly string[];
    move?: readonly [from: string, to: string];
  } = {}
): Contribution[] => {
  const prefix = `${root}${set}/`;
  const files = Object.entries(templates).filter(([key]) =>
    key.startsWith(prefix)
  );
  if (files.length === 0) {
    throw new Error(`Template set "${set}" is empty`);
  }
  for (const path of except) {
    if (templates[`${prefix}${path}`] === undefined) {
      throw new Error(`Template ${set}/${path} does not exist`);
    }
  }
  return files
    .map(([key, content]) => [key.slice(prefix.length), content] as const)
    .filter(([path]) => !except.includes(path))
    .map(([path, content]) =>
      file(
        move !== undefined && path.startsWith(move[0])
          ? `${move[1]}${path.slice(move[0].length)}`
          : path,
        withName(ctx, content)
      )
    );
};
