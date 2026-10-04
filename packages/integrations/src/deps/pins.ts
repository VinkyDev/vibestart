import { readFileSync, writeFileSync } from "node:fs";

import { escapeRegExp } from "es-toolkit/string";
import { z } from "zod";

import { catalog, toolchainVersions } from "#/catalog.ts";
import { repoRoot } from "#/repo.ts";

export interface PinFile {
  readonly path: string;
  readonly pins: ReadonlyMap<string, string>;
  readonly write: (ranges: ReadonlyMap<string, string>) => void;
}

/** Rewrites the one line pinning `key`, keeping its quotes, indentation, and trailing comma. */
export const setPin = (text: string, key: string, from: string, to: string) => {
  const line = new RegExp(
    `^(\\s*"?${escapeRegExp(key)}"?: "?)${escapeRegExp(from)}("?,?)$`,
    "gmu"
  );
  const found = text.match(line)?.length ?? 0;
  if (found !== 1) {
    throw new Error(
      `Expected one line pinning ${key} to ${from}, found ${found}`
    );
  }
  return text.replace(line, (_, head: string, tail: string) =>
    [head, to, tail].join("")
  );
};

const setPins = (
  text: string,
  pins: ReadonlyMap<string, string>,
  ranges: ReadonlyMap<string, string>,
  keyOf: (name: string) => string = (name) => name
) => {
  let next = text;
  for (const [name, to] of ranges) {
    const from = pins.get(name);
    if (from !== undefined && from !== to) {
      next = setPin(next, keyOf(name), from, to);
    }
  }
  return next;
};

const catalogBlock = /^catalog:\n(?<entries>(?:(?: {2}.*)?\n)+)/mu;
const catalogEntry =
  /^ {2}(?<quote>"?)(?<name>[^\s"#]+)\k<quote>: (?<range>\S+)$/gmu;

export const workspaceCatalog = (yaml: string): ReadonlyMap<string, string> => {
  const entries = catalogBlock.exec(yaml)?.groups?.entries;
  if (entries === undefined) {
    throw new Error("pnpm-workspace.yaml has no catalog");
  }
  return new Map(
    [...entries.matchAll(catalogEntry)].map(({ groups }) => [
      groups?.name ?? "",
      groups?.range ?? "",
    ])
  );
};

const fileAt = (path: string) => ({
  read: () => readFileSync(`${repoRoot}${path}`, "utf-8"),
  write: (text: string) => {
    writeFileSync(`${repoRoot}${path}`, text);
  },
});

const workspaceFile = (): PinFile => {
  const path = "pnpm-workspace.yaml";
  const file = fileAt(path);
  const pins = workspaceCatalog(file.read());
  return {
    path,
    pins,
    write: (ranges) => {
      file.write(setPins(file.read(), pins, ranges));
    },
  };
};

const toolchainKeys: ReadonlyMap<string, string> = new Map([
  ["bun", "bun"],
  ["node", "node"],
  ["pnpm", "pnpm"],
  ["vite-plus", "vitePlus"],
]);

/** Its `vite` is written from `toolchainVersions.vitePlus`, so it has no pin of its own. */
const generatedFile = (): PinFile => {
  const path = "packages/integrations/src/catalog.ts";
  const file = fileAt(path);
  const packages = Object.values(catalog)
    .flatMap((group) => Object.entries(group))
    .filter(([name]) => name !== "vite" && !toolchainKeys.has(name));
  const pins = new Map([
    ...packages,
    ["bun", toolchainVersions.bun],
    ["node", toolchainVersions.node],
    ["pnpm", toolchainVersions.pnpm],
    ["vite-plus", toolchainVersions.vitePlus],
  ]);
  return {
    path,
    pins,
    write: (ranges) => {
      file.write(
        setPins(
          file.read(),
          pins,
          ranges,
          (name) => toolchainKeys.get(name) ?? name
        )
      );
    },
  };
};

const manifestSchema = z.looseObject({
  devEngines: z.looseObject({
    packageManager: z.looseObject({
      name: z.literal("pnpm"),
      version: z.string(),
    }),
  }),
  engines: z.looseObject({ node: z.string(), pnpm: z.string() }),
});

/** The schema only checks the file; writes keep its text. */
const manifestFile = (): PinFile => {
  const path = "package.json";
  const file = fileAt(path);
  const manifest = manifestSchema.parse(JSON.parse(file.read()));
  const pins = new Map([
    ["node", manifest.engines.node],
    ["pnpm", manifest.engines.pnpm],
  ]);
  if (manifest.devEngines.packageManager.version !== manifest.engines.pnpm) {
    throw new Error(
      "package.json pins pnpm differently in engines and devEngines"
    );
  }
  return {
    path,
    pins,
    write: (ranges) => {
      const pnpm = ranges.get("pnpm");
      const text = setPins(file.read(), pins, ranges);
      // devEngines pins the same pnpm, under the key `version`.
      file.write(
        pnpm === undefined
          ? text
          : setPin(
              text,
              "version",
              manifest.devEngines.packageManager.version,
              pnpm
            )
      );
    },
  };
};

export const pinFiles = (): readonly PinFile[] => [
  workspaceFile(),
  generatedFile(),
  manifestFile(),
];

export interface Pin {
  readonly name: string;
  readonly ranges: ReadonlyMap<string, string>;
}

export const pinsOf = (files: readonly PinFile[]): readonly Pin[] => {
  const names = [...new Set(files.flatMap((file) => [...file.pins.keys()]))];
  return names.toSorted().map((name) => ({
    name,
    ranges: new Map(
      files.flatMap((file) => {
        const range = file.pins.get(name);
        return range === undefined ? [] : [[file.path, range] as const];
      })
    ),
  }));
};
