import { describe, expect, it } from "vite-plus/test";

import { defaultAddons, generate } from "@vibestart/core";

import { goldens } from "#/goldens.ts";
import { registry } from "#/registry.ts";
import { verifiedName } from "#/verification.ts";

const selections = [[], ["knip"], ["ultracite"], defaultAddons(registry)];
const cases = Object.entries(goldens).flatMap(([name, stack]) =>
  selections.map((addons) => ({
    addons,
    label: `${name}: ${addons.join(",") || "none"}`,
    stack,
  }))
);

describe("independent quality extensions", () => {
  it.each(cases)("$label", async ({ addons, stack }) => {
    const { files } = await generate(
      registry,
      { addons, channel: "recommended", stack },
      { name: verifiedName }
    );
    const text = (filePath: string) =>
      files.find(({ path }) => path === filePath)?.content ?? "";
    const preset = addons.includes("ultracite");
    const knip = addons.includes("knip");
    const shadcn = preset && stack.ui === "shadcn";
    expect({
      dependency: text("package.json").includes('"ultracite"'),
      catalog: text("pnpm-workspace.yaml").includes("ultracite:"),
      presets: text("vite.config.ts").includes("ultracite/"),
      convention: text("AGENTS.md").includes("**Ultracite.**"),
      shadcnPlugin: text("vite.config.ts").includes("@shadcn/lint"),
      shadcnDependency: text("package.json").includes("@shadcn/lint"),
      shadcnConvention: text("AGENTS.md").includes("App code is checked by"),
      typeAware: text("vite.config.ts").includes("typeAware: true"),
      typeCheck: text("vite.config.ts").includes("typeCheck: true"),
      knip: text("package.json").includes("vp run knip"),
    }).toStrictEqual({
      dependency: preset,
      catalog: preset,
      presets: preset,
      convention: preset,
      shadcnPlugin: shadcn,
      shadcnDependency: shadcn,
      shadcnConvention: shadcn,
      typeAware: true,
      typeCheck: true,
      knip,
    });
  });
});
