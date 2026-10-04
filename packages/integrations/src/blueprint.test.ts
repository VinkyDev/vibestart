import { describe, expect, it } from "vite-plus/test";

import {
  blueprintJsonSchema,
  compose,
  createBlueprintSchema,
  defaultAddons,
} from "@vibestart/core";

import { formatWithProjectConfig } from "#/oxfmt.ts";
import { registry } from "#/registry.ts";

const stack = compose(registry, {});

describe("blueprint", () => {
  it("the published JSON Schema", async () => {
    const { code } = await formatWithProjectConfig(
      "schema.json",
      JSON.stringify(blueprintJsonSchema(registry)),
      "@vibestart"
    );
    await expect(code).toMatchFileSnapshot("../schema.json");
  });

  it("a blueprint that names no add-ons takes the defaults", () => {
    const result = createBlueprintSchema(registry).parse({
      channel: "recommended",
      stack,
    });
    expect(result.addons).toStrictEqual(defaultAddons(registry));
  });

  it("a blueprint names only registered add-ons", () => {
    const result = createBlueprintSchema(registry).safeParse({
      addons: ["eslint"],
      channel: "recommended",
      stack,
    });
    expect(result.success).toBeFalsy();
  });

  it("an empty add-on selection opts out, and duplicates are normalized", () => {
    const schema = createBlueprintSchema(registry);
    expect(
      schema.parse({ addons: [], channel: "recommended", stack }).addons
    ).toStrictEqual([]);
    expect(
      schema.parse({ addons: ["knip", "knip"], channel: "recommended", stack })
        .addons
    ).toStrictEqual(["knip"]);
  });

  it("a blueprint names only registered integrations", () => {
    const result = createBlueprintSchema(registry).safeParse({
      channel: "recommended",
      stack: { frontend: "vue" },
    });
    expect(result.success).toBeFalsy();
  });
});
