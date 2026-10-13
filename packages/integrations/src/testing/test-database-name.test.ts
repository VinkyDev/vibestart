import { stripTypeScriptTypes } from "node:module";

import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

// The Vite transform skips templates, so the generated source is loaded the way a project runs it.
const sources = import.meta.glob<string>(
  "../../templates/testing/database/*/packages/db/src/test-database-name.ts",
  { eager: true, import: "default", query: "?raw" }
);

const templateModule = z.object({
  testDatabaseName: z.function({ input: [z.string()], output: z.string() }),
});

const nameOf = async (
  database: string
): Promise<(configured: string) => string> => {
  const source =
    sources[
      `../../templates/testing/database/${database}/packages/db/src/test-database-name.ts`
    ];
  if (source === undefined) {
    throw new Error(`No test database name template for ${database}`);
  }
  const code = stripTypeScriptTypes(source);
  const loaded: unknown = await import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
  );
  const { testDatabaseName } = templateModule.parse(loaded);
  return testDatabaseName;
};

const mysqlName = await nameOf("mysql");
const postgresName = await nameOf("postgres");

const bytes = (value: string) => new TextEncoder().encode(value).length;

// Identifier limits from the MySQL (64 characters) and PostgreSQL (63 bytes) documentation.
describe.each([
  {
    database: "MySQL",
    limit: 64,
    measure: (v: string) => v.match(/./gsu)?.length ?? 0,
    name: mysqlName,
  },
  { database: "PostgreSQL", limit: 63, measure: bytes, name: postgresName },
])("$database test database name", ({ limit, measure, name }) => {
  it.each([
    ["short", "app"],
    ["at the limit", "a".repeat(limit)],
    ["past the limit", "a".repeat(limit + 40)],
    ["multibyte", "数据库".repeat(40)],
    ["emoji", "😀".repeat(40)],
  ])("fits the limit for a %s configured name", (_, configured) => {
    expect(measure(name(configured))).toBeLessThanOrEqual(limit);
  });

  it("keeps a short configured name whole and the suffix random", () => {
    const [first, second] = [name("app"), name("app")];
    expect(first).toMatch(/^app_test_[0-9a-f]{8}$/u);
    expect(first).not.toBe(second);
  });

  it("randomizes the name of a long configured name", () => {
    const configured = "a".repeat(limit + 10);
    expect(name(configured)).not.toBe(name(configured));
  });

  it("never splits a character", () => {
    const configured = "数据库".repeat(40);
    const prefix = name(configured).replace(/_test_[0-9a-f]{8}$/u, "");
    expect(configured.startsWith(prefix)).toBeTruthy();
  });
});
