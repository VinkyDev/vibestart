import { stacks } from "virtual:vibestart";
import { describe, expect, it } from "vite-plus/test";

import {
  addonsFlag,
  commandLine,
  commandWords,
  e2eRunner,
  entryFromFlags,
  flagsOf,
  integrationOf,
  outcome,
  parseAddons,
  parseFlags,
  recommended,
  searchSchema,
  verificationWith,
  verifiedAddons,
  whyIncluded,
} from "#/lib/stack.ts";

const entry = (label: string) => {
  const found = stacks.find((candidate) => candidate.label === label);
  if (found === undefined) {
    throw new Error(`No stack ${label}`);
  }
  return found;
};

describe("stack flags", () => {
  it("round-trips the selected runner through URL flags and CLI output", () => {
    const { stack } = entryFromFlags({ testing: "e2e" });
    expect(stack.testing).toBe("e2e");
    const flags = flagsOf(stack);
    expect(parseFlags(searchSchema.parse(flags)).testing).toBe("e2e");
    expect(entryFromFlags(flags).stack).toStrictEqual(stack);
    expect(commandLine(commandWords(flags, "my-app", "pnpm"))).toContain(
      "--testing e2e"
    );
    expect(recommended.testing).toBe("playwright");
  });

  it("shows an end-to-end runner only for a stack with a web app", () => {
    expect(e2eRunner(recommended)?.name).toBe("Playwright");
    expect(e2eRunner(entry("hono-openapi-sqlite").stack)).toBeUndefined();
  });

  it("names every legal stack, and the stack it names is the same one", () => {
    for (const { label, stack } of stacks) {
      expect(entryFromFlags(flagsOf(stack)).label).toBe(label);
    }
  }, 60_000);

  it("leaves out the decisions the others imply", () => {
    expect(flagsOf(entry("hono-openapi-sqlite").stack)).toStrictEqual({
      api: "openapi",
      auth: "none",
      database: "sqlite",
      deployment: "none",
      framework: "none",
    });
  });
});

describe("desktop shell", () => {
  it("is chosen with the flag the CLI takes", () => {
    const { stack } = entryFromFlags({ desktop: "electron" });
    expect(stack.desktop).toBe("electron");
    expect(stack.framework).toBe("spa");
    expect(flagsOf(stack).desktop).toBe("electron");
  });

  it("moves a frontend that cannot host it to a single-page app", () => {
    const next = outcome(
      entryFromFlags({ framework: "next" }).stack,
      "desktop",
      "electron"
    );
    expect(next?.entry.stack.framework).toBe("spa");
  });
});

describe("flags to a stack", () => {
  it("starts where the CLI's compose starts", () => {
    expect(entryFromFlags({}).label).toBe("spa-hono-orpc-sqlite-better-auth");
  });

  it("recommends the stack the CLI creates without flags", () => {
    expect(recommended).toStrictEqual(entryFromFlags({}).stack);
  });

  it("repairs flags that leave no legal stack", () => {
    const { stack } = entryFromFlags({ backend: "self", framework: "spa" });
    expect(stack.framework === "spa" || stack.backend === "self").toBeTruthy();
  });
});

describe("search params", () => {
  it("keeps only offered values of decided kinds", () => {
    expect(
      parseFlags(
        searchSchema.parse({
          database: "mongo",
          deployment: "none",
          framework: "next",
          orm: "drizzle",
        })
      )
    ).toStrictEqual({ deployment: "none", framework: "next" });
  });
});

describe("add-ons", () => {
  it("takes the defaults unless the search names others the registry offers", () => {
    expect(parseAddons()).toStrictEqual(verifiedAddons);
    expect(parseAddons("none")).toStrictEqual([]);
    expect(parseAddons("knip")).toStrictEqual(["knip"]);
    expect(parseAddons("eslint")).toStrictEqual(verifiedAddons);
  });

  it("takes Ultracite alone or alongside Knip", () => {
    expect(parseAddons("ultracite")).toStrictEqual(["ultracite"]);
    expect(parseAddons("ultracite,knip")).toStrictEqual(verifiedAddons);
  });

  it("names them in the search and the command only when they are not the defaults", () => {
    expect(addonsFlag(verifiedAddons)).toBeUndefined();
    expect(addonsFlag([])).toBe("none");
    const { stack } = entry("hono-openapi-sqlite");
    expect(
      commandLine(commandWords(flagsOf(stack), "acme", "pnpm", []))
    ).toMatch(/ --addons none$/u);
  });

  it("stays verified without a default add-on", () => {
    for (const stack of stacks) {
      expect(verificationWith(stack, [])).toBe(stack.verification);
    }
  });
});

describe("choosing an option", () => {
  const start = entry("next-self-orpc-sqlite-better-auth").stack;

  it("offers one outcome per option, even when several fixes would do", () => {
    const hono = entry("spa-hono-openapi-sqlite").stack;
    expect(outcome(hono, "backend", "self")?.changes).toStrictEqual([
      { from: "spa", kind: "framework", to: "tanstack-start" },
      { from: "openapi", kind: "api", to: "orpc" },
    ]);
  });

  it("changes nothing else when the choice alone is legal", () => {
    const only = outcome(start, "database", "postgres");
    expect(only?.changes).toHaveLength(0);
    expect(only?.entry.label).toBe("next-self-orpc-postgres-better-auth");
  });

  it("carries the fewest other changes when the choice alone is not legal", () => {
    const only = outcome(start, "framework", "spa");
    expect(only?.changes).toStrictEqual([
      { from: "self", kind: "backend", to: "hono" },
    ]);
    expect(only?.entry.label).toBe("spa-hono-orpc-sqlite-better-auth");
  });
});

describe("why an integration is included", () => {
  it("names what needs an integration nobody chose", () => {
    const { stack } = entry("hono-postgres-better-auth");
    expect(whyIncluded(stack, integrationOf("drizzle"))).toBe(
      "PostgreSQL and Better Auth need a SQL ORM."
    );
  });

  it("leaves out a requirement another alternative already meets", () => {
    const { stack } = entry("next-self-orpc-docker");
    expect(whyIncluded(stack, integrationOf("self"))).toBe(
      "oRPC needs an HTTP server."
    );
  });

  it("gives no reason for the foundation, which nothing needs", () => {
    const { stack } = entry("hono-postgres-better-auth");
    expect(whyIncluded(stack, integrationOf("vite-plus"))).toBeUndefined();
  });
});

describe("the create command", () => {
  it("writes the command a person runs", () => {
    const { stack } = entry("next-self-orpc-sqlite-better-auth-docker");
    expect(commandLine(commandWords(flagsOf(stack), "acme", "pnpm"))).toBe(
      "pnpm dlx vibestart-cli acme --framework next --backend self --api orpc --database sqlite --auth better-auth --deployment docker"
    );
  });
});

describe("Bun selections", () => {
  it("round-trips a Bun Hono runtime and keeps Node as the default", () => {
    const bun = entryFromFlags({ backend: "hono", runtime: "bun" });
    expect(bun.stack.runtime).toBe("bun");
    expect(entryFromFlags(flagsOf(bun.stack)).label).toBe(bun.label);
    expect(entryFromFlags({ backend: "hono" }).stack.runtime).toBe("node");
  });

  it("names the package manager separately from the command runner", () => {
    const flags = flagsOf(entryFromFlags({ backend: "hono" }).stack);
    expect(
      commandLine(commandWords(flags, "acme", "pnpm", verifiedAddons, "bun"))
    ).toContain("--package-manager bun");
    expect(
      commandLine(commandWords(flags, "acme", "bun", verifiedAddons, "pnpm"))
    ).toMatch(/^bunx vibestart-cli/u);
    expect(
      verificationWith(
        { ...entryFromFlags({}), bunVerification: null },
        verifiedAddons,
        "bun"
      )
    ).toBeNull();
  });
});
