import { readFileSync } from "node:fs";

import { major, minVersion } from "semver";
import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

import { pinFiles, pinsOf, setPin, workspaceCatalog } from "#/deps/pins.ts";
import { repoRoot } from "#/repo.ts";

const yaml = `packages:
  - apps/*

catalog:
  # toolchain
  "@types/node": ^24.13.6
  vite: npm:@voidzero-dev/vite-plus-core@1.0.0
  vite-plus: 1.0.0

overrides:
  vite@*: "catalog:"
`;

describe("writing a pin", () => {
  it("rewrites a YAML pin, quoted or bare, and nothing else", () => {
    const moved = setPin(yaml, "@types/node", "^24.13.6", "^24.19.0");
    expect(setPin(moved, "vite-plus", "1.0.0", "1.1.0")).toBe(
      yaml
        .replace("^24.13.6", "^24.19.0")
        .replace("vite-plus: 1.0.0", "vite-plus: 1.1.0")
    );
  });

  it("rewrites an object literal's pin, keeping its quotes and comma", () => {
    const source = `  toolchain: {\n    "@types/node": "^24.13.6",\n    knip: "^6.38.0",\n  },`;
    expect(setPin(source, "knip", "^6.38.0", "^6.39.0")).toBe(
      source.replace("^6.38.0", "^6.39.0")
    );
  });

  it("refuses a pin it cannot place on exactly one line", () => {
    expect(() => setPin(yaml, "knip", "^6.38.0", "^6.39.0")).toThrow("found 0");
    expect(() =>
      setPin(`a: 1.0.0\n  a: 1.0.0\n`, "a", "1.0.0", "2.0.0")
    ).toThrow("found 2");
  });
});

describe("reading the workspace catalog", () => {
  it("reads the catalog's pins, and none of the blocks around it", () => {
    expect(workspaceCatalog(yaml)).toStrictEqual(
      new Map([
        ["@types/node", "^24.13.6"],
        ["vite", "npm:@voidzero-dev/vite-plus-core@1.0.0"],
        ["vite-plus", "1.0.0"],
      ])
    );
  });
});

describe("the pins of this repository and the projects it generates", () => {
  const pins = new Map(
    pinsOf(pinFiles()).map((pin) => [
      pin.name,
      [...new Set(pin.ranges.values())],
    ])
  );
  const only = (name: string) => {
    const [range, ...others] = pins.get(name) ?? [];
    expect(others).toStrictEqual([]);
    return range ?? "";
  };

  it("pins each package to one range everywhere", () => {
    expect(
      [...pins].filter(([, ranges]) => ranges.length > 1).map(([name]) => name)
    ).toStrictEqual([]);
  });

  // `vp run deps update` moves these with the pin they follow, and the rest of the repo relies on the match.
  it("pins the oxfmt and vite core that Vite+ runs", () => {
    const vitePlus = z
      .object({
        dependencies: z.object({ oxfmt: z.string(), vite: z.string() }),
      })
      .parse(
        JSON.parse(
          readFileSync(
            `${repoRoot}node_modules/vite-plus/package.json`,
            "utf-8"
          )
        )
      );
    expect(only("oxfmt")).toBe(
      minVersion(vitePlus.dependencies.oxfmt)?.version
    );
    expect(only("vite")).toBe(vitePlus.dependencies.vite);
  });

  it("pins the types of the Node.js major it runs", () => {
    expect(major(minVersion(only("@types/node")) ?? "0.0.0")).toBe(
      major(only("node"))
    );
  });
});
