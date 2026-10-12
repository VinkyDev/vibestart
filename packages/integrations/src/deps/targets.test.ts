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

const expoModules = new Map([
  [
    "58.0.7",
    {
      react: "19.3.0",
      "react-native": "0.88.0-rc.4",
      "expo-router": "~58.0.17",
    },
  ],
  [
    "58.0.9",
    {
      react: "19.3.1",
      "react-native": "0.88.0",
      "expo-router": "~58.0.19",
    },
  ],
]);

const releases: Releases = {
  expoModules: async (expo) => {
    await Promise.resolve();
    const modules = expoModules.get(expo);
    if (modules === undefined) {
      throw new Error(`no fixture for expo ${expo}`);
    }
    return modules;
  },
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
      expo: packument("58.0.9", ["58.0.7"]),
      "expo-router": packument("58.0.19", ["58.0.17", "58.0.18", "58.1.0"]),
      oxfmt: packument("0.71.0", ["0.70.0"]),
      react: packument("19.4.0", ["19.3.0", "19.3.1"]),
      "react-native": packument("0.89.0", ["0.88.0-rc.4", "0.88.0"]),
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

const targetOf = async (
  pins: readonly Pin[],
  name: string,
  selected?: (name: string) => boolean
) => {
  const targets = await targetsOf(pins, releases, selected);
  return targets.find((target) => target.name === name)?.target;
};

const vitePlusOnly = (name: string) => name === "vite-plus";
const oxfmtOnly = (name: string) => name === "oxfmt";
const reactOnly = (name: string) => name === "react";

describe("where a pin moves", () => {
  it("moves a package to its latest release, keeping how the range is written", async () => {
    await expect(
      targetOf([pin("electron", "^44.4.5")], "electron")
    ).resolves.toBe("^44.5.1");
    await expect(
      targetOf([pin("electron", "~44.4.5")], "electron")
    ).resolves.toBe("~44.5.1");
    await expect(
      targetOf([pin("electron", "44.4.5")], "electron")
    ).resolves.toBe("44.5.1");
  });

  it("moves a pin ahead of `latest` to the newest stable tag on its major", async () => {
    await expect(
      targetOf([pin("electron-builder", "^26.17.0")], "electron-builder")
    ).resolves.toBe("^26.17.0");
    // Expo tags an SDK beta `next` while `latest` holds the previous SDK.
    const beta: Releases = {
      ...releases,
      expoModules: async () => {
        await Promise.resolve();
        return {};
      },
      packument: () => ({
        distTags: {
          canary: "58.0.0-canary-20260909-ea7a89a",
          latest: "57.0.27",
          next: "58.0.8",
          "sdk-57": "57.0.27",
        },
        versions: { "57.0.27": {}, "58.0.7": {}, "58.0.8": {} },
      }),
    };
    await expect(
      targetsOf([pin("expo", "58.0.7")], beta)
    ).resolves.toMatchObject([{ target: "58.0.8" }]);
  });

  it("keeps a prerelease pin on its channel until a stable release passes it", async () => {
    await expect(
      targetOf([pin("drizzle-orm", "1.0.0-rc.4")], "drizzle-orm")
    ).resolves.toBe("1.0.0-rc.5");
    await expect(
      targetOf([pin("nitro", "3.0.260903-beta")], "nitro")
    ).resolves.toBe("3.0.260910-beta");
    const released: Releases = {
      ...releases,
      packument: () => packument("1.0.0", ["1.0.0-rc.5"]),
    };
    await expect(
      targetsOf([pin("drizzle-orm", "1.0.0-rc.4")], released)
    ).resolves.toMatchObject([{ target: "1.0.0" }]);
  });

  it("moves Node.js to its newest LTS release, and its types to that major", async () => {
    const pins = [pin("node", "24.21.0"), pin("@types/node", "^24.13.6")];
    await expect(targetOf(pins, "node")).resolves.toBe("24.22.0");
    await expect(targetOf(pins, "@types/node")).resolves.toBe("^24.19.0");
  });

  it("moves oxfmt and the vite core to the ones Vite+ runs", async () => {
    const pins = [
      pin("vite-plus", "1.0.0"),
      pin("oxfmt", "0.70.0"),
      pin("vite", "npm:@voidzero-dev/vite-plus-core@1.0.0"),
    ];
    await expect(targetOf(pins, "vite-plus")).resolves.toBe("1.1.0");
    await expect(targetOf(pins, "oxfmt")).resolves.toBe("0.71.0");
    await expect(targetOf(pins, "vite")).resolves.toBe(
      "npm:@voidzero-dev/vite-plus-core@1.1.0"
    );
  });

  it("moves only the selected pins, and the pins that follow them", async () => {
    const pins = [
      pin("electron", "^44.4.5"),
      pin("vite-plus", "1.0.0"),
      pin("oxfmt", "0.70.0"),
    ];
    await expect(targetOf(pins, "electron", vitePlusOnly)).resolves.toBe(
      "^44.4.5"
    );
    await expect(targetOf(pins, "oxfmt", vitePlusOnly)).resolves.toBe("0.71.0");
    // A follower on its own moves to what the pin it follows runs now.
    await expect(targetOf(pins, "vite-plus", oxfmtOnly)).resolves.toBe("1.0.0");
    await expect(targetOf(pins, "oxfmt", oxfmtOnly)).resolves.toBe("0.70.0");
    await expect(targetOf(pins, "oxfmt", () => false)).resolves.toBe("0.70.0");
  });

  it("moves a package the Expo SDK bundles to the newest release in the range that SDK names", async () => {
    const pins = [
      pin("expo", "58.0.7"),
      pin("react", "19.3.0"),
      pin("react-native", "0.88.0-rc.4"),
      pin("expo-router", "~58.0.17"),
    ];
    await expect(targetOf(pins, "react")).resolves.toBe("19.3.1");
    await expect(targetOf(pins, "react-native")).resolves.toBe("0.88.0");
    await expect(targetOf(pins, "expo-router")).resolves.toBe("~58.0.19");
    // Without expo moving, a bundled package stays where the SDK it runs with puts it.
    await expect(targetOf(pins, "react", reactOnly)).resolves.toBe("19.3.0");
    await expect(targetOf(pins, "expo-router", reactOnly)).resolves.toBe(
      "~58.0.17"
    );
  });

  it("counts a pin its files disagree on as behind, toward the higher range", async () => {
    const targets = await targetsOf(
      [pin("electron", "^44.5.1", "^44.4.5")],
      releases
    );
    const behind = targets.filter(isBehind).map(({ target }) => target);
    expect(behind).toStrictEqual(["^44.5.1"]);
  });
});
