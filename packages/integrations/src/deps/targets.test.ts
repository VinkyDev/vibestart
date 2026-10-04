import { describe, expect, it } from "vite-plus/test";

import type { Pin } from "#/deps/pins.ts";
import type { Packument, Releases } from "#/deps/targets.ts";
import { isBehind, targetsOf } from "#/deps/targets.ts";

const packument = (
  latest: string,
  versions: readonly string[],
  dependencies: Readonly<Record<string, Record<string, string>>> = {}
): Packument => ({
  distTags: { latest },
  versions: Object.fromEntries(
    [latest, ...versions].map((version) => [
      version,
      { dependencies: dependencies[version] },
    ])
  ),
});

const releases: Releases = {
  nodeLts: "24.22.0",
  packument: (name) => {
    const found = {
      "@types/node": packument("26.1.0", ["24.13.6", "24.19.0", "26.0.0"]),
      "drizzle-orm": packument("0.45.3", [
        "1.0.0-rc.4",
        "1.0.0-rc.5",
        "1.0.0-rc.6-ab785fc",
      ]),
      electron: packument("44.5.1", ["44.4.5", "45.0.0-beta.1"]),
      "electron-builder": packument("26.15.3", ["26.17.0"]),
      nitro: packument("3.0.260903-beta", ["3.0.260910-beta", "3.0.0-alpha.9"]),
      oxfmt: packument("0.71.0", ["0.70.0"]),
      "vite-plus": packument("1.1.0", ["1.0.0"], {
        "1.0.0": {
          oxfmt: "=0.70.0",
          vite: "npm:@voidzero-dev/vite-plus-core@1.0.0",
        },
        "1.1.0": {
          oxfmt: "=0.71.0",
          vite: "npm:@voidzero-dev/vite-plus-core@1.1.0",
        },
      }),
    }[name];
    if (found === undefined) {
      throw new Error(`no fixture for ${name}`);
    }
    return found;
  },
};

const pin = (name: string, ...ranges: readonly string[]): Pin => ({
  name,
  ranges: new Map(ranges.map((range, index) => [`file-${index}`, range])),
});

const targetOf = (
  pins: readonly Pin[],
  name: string,
  selected?: (name: string) => boolean
) =>
  targetsOf(pins, releases, selected).find((target) => target.name === name)
    ?.target;

const vitePlusOnly = (name: string) => name === "vite-plus";
const oxfmtOnly = (name: string) => name === "oxfmt";

describe("where a pin moves", () => {
  it("moves a package to its latest release, keeping how the range is written", () => {
    expect(targetOf([pin("electron", "^44.4.5")], "electron")).toBe("^44.5.1");
    expect(targetOf([pin("electron", "~44.4.5")], "electron")).toBe("~44.5.1");
    expect(targetOf([pin("electron", "44.4.5")], "electron")).toBe("44.5.1");
  });

  it("stays when `latest` is behind the pin", () => {
    expect(
      targetOf([pin("electron-builder", "^26.17.0")], "electron-builder")
    ).toBe("^26.17.0");
  });

  it("keeps a prerelease pin on its channel until a stable release passes it", () => {
    expect(targetOf([pin("drizzle-orm", "1.0.0-rc.4")], "drizzle-orm")).toBe(
      "1.0.0-rc.5"
    );
    expect(targetOf([pin("nitro", "3.0.260903-beta")], "nitro")).toBe(
      "3.0.260910-beta"
    );
    const released: Releases = {
      ...releases,
      packument: () => packument("1.0.0", ["1.0.0-rc.5"]),
    };
    expect(
      targetsOf([pin("drizzle-orm", "1.0.0-rc.4")], released)[0]?.target
    ).toBe("1.0.0");
  });

  it("moves Node.js to its newest LTS release, and its types to that major", () => {
    const pins = [pin("node", "24.21.0"), pin("@types/node", "^24.13.6")];
    expect(targetOf(pins, "node")).toBe("24.22.0");
    expect(targetOf(pins, "@types/node")).toBe("^24.19.0");
  });

  it("moves oxfmt and the vite core to the ones Vite+ runs", () => {
    const pins = [
      pin("vite-plus", "1.0.0"),
      pin("oxfmt", "0.70.0"),
      pin("vite", "npm:@voidzero-dev/vite-plus-core@1.0.0"),
    ];
    expect(targetOf(pins, "vite-plus")).toBe("1.1.0");
    expect(targetOf(pins, "oxfmt")).toBe("0.71.0");
    expect(targetOf(pins, "vite")).toBe(
      "npm:@voidzero-dev/vite-plus-core@1.1.0"
    );
  });

  it("moves only the selected pins, and the pins that follow them", () => {
    const pins = [
      pin("electron", "^44.4.5"),
      pin("vite-plus", "1.0.0"),
      pin("oxfmt", "0.70.0"),
    ];
    expect(targetOf(pins, "electron", vitePlusOnly)).toBe("^44.4.5");
    expect(targetOf(pins, "oxfmt", vitePlusOnly)).toBe("0.71.0");
    // A follower on its own moves to what the pin it follows runs now.
    expect(targetOf(pins, "vite-plus", oxfmtOnly)).toBe("1.0.0");
    expect(targetOf(pins, "oxfmt", oxfmtOnly)).toBe("0.70.0");
    expect(targetOf(pins, "oxfmt", () => false)).toBe("0.70.0");
  });

  it("counts a pin its files disagree on as behind, toward the higher range", () => {
    const behind = targetsOf([pin("electron", "^44.5.1", "^44.4.5")], releases)
      .filter(isBehind)
      .map(({ target }) => target);
    expect(behind).toStrictEqual(["^44.5.1"]);
  });
});
