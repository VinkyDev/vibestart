import { describe, expect, it } from "vite-plus/test";

import {
  check,
  compose,
  generate,
  createBlueprintSchema,
  legalStacks,
  resolve,
} from "@vibestart/core";

import agentsEffect from "#/effect/agents-effect.md?raw";
import { registry } from "#/registry.ts";

describe("stack modes", () => {
  it("generates the Effect design without a second transport or state stack", async () => {
    const output = await generate(
      registry,
      {
        stack: compose(registry, { mode: "effect", database: "postgres" }),
        addons: [],
        channel: "recommended",
      },
      { name: "effect-app" }
    );

    const manifests = output.files
      .filter(
        ({ path }) =>
          path.endsWith("package.json") || path === "pnpm-workspace.yaml"
      )
      .map(({ content }) => content)
      .join("\n");

    for (const dependency of [
      "@tanstack/react-query",
      "@orpc/",
      '"hono"',
      '"zod"',
      '"undici"',
      '"es-toolkit"',
    ]) {
      expect(manifests).not.toContain(dependency);
    }

    expect(manifests).toContain('"@effect/atom-react"');
    expect(
      output.files.some(({ path }) => path.endsWith("query-client.ts"))
    ).toBeFalsy();
    expect(
      output.files.find(({ path }) => path === "packages/db/src/index.ts")
        ?.content
    ).toContain("drizzle-orm/effect-postgres");
    expect(
      output.files.find(({ path }) => path === "vibestart.jsonc")?.content
    ).toContain('"mode": "effect"');
  });

  it("equips Effect projects with the root Effect package and agent guide", async () => {
    const { files } = await generate(
      registry,
      {
        stack: compose(registry, { mode: "effect", database: null }),
        addons: ["knip"],
        channel: "recommended",
      },
      { name: "effect-app" }
    );

    expect(
      files.find(({ path }) => path === "package.json")?.content
    ).toContain('"effect": "catalog:"');
    expect(files.find(({ path }) => path === "knip.json")?.content).toContain(
      '"ignoreDependencies": ["effect"]'
    );
    expect(files.find(({ path }) => path === "AGENTS.md")?.content).toContain(
      agentsEffect.trimEnd()
    );
  });

  it("keeps existing recipes in standard mode", () => {
    const stack = { ...compose(registry, {}) };
    delete stack.mode;
    expect(
      createBlueprintSchema(registry).parse({ channel: "recommended", stack })
        .stack.mode
    ).toBe("standard");
  });

  it("offers both test runners with optional persistence and authentication", () => {
    const { stacks } = resolve(registry, { mode: "effect" });
    expect(stacks).toHaveLength(20);

    for (const database of [undefined, "postgres", "sqlite"]) {
      for (const auth of database === undefined
        ? [undefined]
        : [undefined, "better-auth"]) {
        for (const testing of ["playwright", "e2e"]) {
          for (const deployment of [undefined, "docker"]) {
            expect(
              stacks.map((stack) => ({
                mode: stack.mode,
                database: stack.database,
                auth: stack.auth,
                testing: stack.testing,
                deployment: stack.deployment,
                orm: stack.orm,
              }))
            ).toContainEqual(
              expect.objectContaining({
                mode: "effect",
                database,
                auth,
                testing,
                deployment,
                orm: database === undefined ? undefined : "drizzle",
              })
            );
          }
        }
      }
    }
  });

  it.each(["playwright", "e2e"])(
    "omits unused database and auth code with %s",
    async (testing) => {
      const output = await generate(
        registry,
        {
          stack: compose(registry, {
            mode: "effect",
            database: null,
            auth: null,
            orm: null,
            testing,
          }),
          addons: [],
          channel: "recommended",
        },
        { name: "effect-app" }
      );

      const files = output.files.map(({ path }) => path);
      expect(files).not.toContain("packages/db/src/index.ts");
      expect(files).not.toContain("packages/auth/src/index.ts");
      expect(files).not.toContain("apps/server/src/migrate.ts");

      const source = output.files
        .filter(({ path }) => !path.endsWith(".md"))
        .map(({ content }) => content)
        .join("\n");

      for (const unused of [
        "DATABASE_URL",
        "BETTER_AUTH",
        "drizzle-orm",
        "@effect/sql-pg",
        "@effect/sql-sqlite-node",
        "@effect-app/db",
        "@effect-app/auth",
      ]) {
        expect(source).not.toContain(unused);
      }
    }
  );

  it.each(["postgres", "sqlite"])(
    "describes unauthenticated %s todos as shared data",
    async (database) => {
      const { files } = await generate(
        registry,
        {
          stack: compose(registry, { mode: "effect", database, auth: null }),
          addons: [],
          channel: "recommended",
        },
        { name: "effect-app" }
      );

      const page = files.find(
        ({ path }) => path === "apps/web/src/routes/todos.tsx"
      )?.content;

      expect(page).toContain("Shared by everyone who opens the app.");
      expect(page).not.toContain("Private to your account.");
    }
  );

  it.each([null, "postgres", "sqlite"])(
    "documents the required public origin for %s Effect containers without auth",
    async (database) => {
      const { files } = await generate(
        registry,
        {
          stack: compose(registry, {
            mode: "effect",
            database,
            auth: null,
            deployment: "docker",
          }),
          addons: [],
          channel: "recommended",
        },
        { name: "effect-app" }
      );

      const production = files
        .find(({ path }) => path === "README.md")
        ?.content.split("## Production")[1];

      expect(production).toContain("`APP_URL` (the public origin)");
      expect(production).not.toContain("BETTER_AUTH");

      expect(production?.includes("The migration reads `DATABASE_URL`;")).toBe(
        database !== null
      );
    }
  );

  it.each([
    { backend: "hono" },
    { api: "orpc" },
    { orm: "prisma" },
    { database: "mysql" },
    { framework: "next" },
    { runtime: "bun" },
    { mobile: "expo" },
    { desktop: "electron" },
    { deployment: "void" },
  ])("rejects unadapted choices in Effect mode: %j", (choice) => {
    const stack = { ...compose(registry, { mode: "effect" }), ...choice };
    expect(check(registry, stack).length).toBeGreaterThan(0);
  });

  it("never changes modes while repairing a choice within a mode", () => {
    const result = resolve(
      registry,
      { mode: "effect", database: "mysql" },
      { keep: ["mode"] }
    );

    expect(result.fixes.length).toBeGreaterThan(0);
    expect(
      result.fixes
        .flatMap(({ changes }) => changes)
        .every(({ kind }) => kind !== "mode")
    ).toBeTruthy();
  });

  it("keeps Effect transports out of every standard stack", () => {
    for (const stack of legalStacks(registry).filter(
      ({ mode }) => mode === "standard"
    )) {
      expect(stack.backend).not.toBe("effect-http");
      expect(stack.api).not.toBe("effect-rpc");
    }
  });
});
