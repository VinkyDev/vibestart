import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

import type { Stack } from "@vibestart/core";
import { defaultAddons, generate, legalStacks } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { stackLabel } from "#/stack-label.ts";

const stackNamed = (label: string): Stack => {
  const stack = legalStacks(registry).find(
    (legal) => stackLabel(legal) === label
  );
  if (stack === undefined) {
    throw new Error(`${label} is not a legal stack`);
  }
  return stack;
};

const project = async (label: string, name = "my-app") => {
  const { files } = await generate(
    registry,
    {
      addons: defaultAddons(registry),
      channel: "recommended",
      stack: stackNamed(label),
    },
    { name }
  );
  return (filePath: string) => {
    const found = files.find(({ path }) => path === filePath);
    if (found === undefined) {
      throw new Error(`${label} has no ${filePath}`);
    }
    return found.content;
  };
};

describe("the Expo app", () => {
  it("takes its scheme from the project name, and its store ids without the dashes", async () => {
    const text = await project("expo", "acme-2-go");
    const { expo } = z
      .object({
        expo: z.object({
          android: z.object({ package: z.string() }),
          ios: z.object({ bundleIdentifier: z.string() }),
          scheme: z.string(),
        }),
      })
      .parse(JSON.parse(text("apps/mobile/app.json")));
    expect({
      android: expo.android.package,
      ios: expo.ios.bundleIdentifier,
      scheme: expo.scheme,
    }).toStrictEqual({
      android: "com.acme2go.app",
      ios: "com.acme2go.app",
      scheme: "acme-2-go",
    });
  });

  it("is a project on its own, started with dev:mobile", async () => {
    const text = await project("expo");
    const { scripts } = z
      .object({ scripts: z.record(z.string(), z.string()) })
      .parse(JSON.parse(text("package.json")));
    expect(scripts.dev).toBeUndefined();
    expect(scripts["dev:mobile"]).toBe("vp run --filter @my-app/mobile start");
    expect(text("README.md")).toContain("vp install\nvp run dev:mobile\n");
  });

  it("starts in a second terminal beside the dev servers", async () => {
    const text = await project("spa-expo");
    expect(text("README.md")).toMatch(
      /vp run dev\nvp run dev:mobile +# in a second terminal\n/u
    );
  });

  it("shares the React lint preset with a web app, imported once", async () => {
    const text = await project("spa-expo");
    expect(text("vite.config.ts").match(/^import react from /gmu)).toHaveLength(
      1
    );
  });

  it("styles its own components at call sites, which shadcn's lint forbids in the web app", async () => {
    const [alone, beside] = await Promise.all([
      project("expo"),
      project("spa-expo"),
    ]);
    expect(alone("vite.config.ts")).not.toContain("shadcn/no-restyle");
    expect(beside("vite.config.ts")).toContain('"shadcn/no-restyle": "off"');
  });

  it("type-checks the Metro config from the root, outside the React Native preset", async () => {
    const text = await project("expo");
    expect(JSON.parse(text("tsconfig.json"))).toStrictEqual({
      extends: "@my-app/config/typescript/node.json",
      include: ["vite.config.ts", "apps/mobile/metro.config.ts"],
    });
  });
});
