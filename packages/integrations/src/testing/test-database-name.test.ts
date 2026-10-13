import { stripTypeScriptTypes } from "node:module";

import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

// The Vite transform skips templates, so the generated source is loaded the way a project runs it.
const [source] = Object.values(
  import.meta.glob<string>(
    "../../templates/testing/database/packages/db/src/test-database-name.ts",
    { eager: true, import: "default", query: "?raw" }
  )
);

const { testDatabaseName } = z
  .object({
    testDatabaseName: z.function({ input: [z.string()], output: z.string() }),
  })
  .parse(
    await import(
      `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(z.string().parse(source))).toString("base64")}`
    )
  );

const bytes = (value: string) => new TextEncoder().encode(value).length;
const characters = (value: string) => value.match(/./gsu)?.length ?? 0;
const suffix = /_test_[0-9a-f]{8}$/u;

// MySQL allows 64 characters and PostgreSQL 63 bytes of UTF-8; 63 bytes satisfies both.
describe("testDatabaseName", () => {
  it.each([
    "app",
    "a".repeat(63),
    "a".repeat(100),
    "数据库".repeat(40),
    "😀".repeat(40),
  ])("fits both identifier limits for %s", (configured) => {
    const name = testDatabaseName(configured);
    expect(bytes(name)).toBeLessThanOrEqual(63);
    expect(characters(name)).toBeLessThanOrEqual(64);
    expect(name).toMatch(suffix);
  });

  it("keeps a name that fits and cuts one that does not between characters", () => {
    const long = "数据库".repeat(40);
    expect(testDatabaseName("app")).toMatch(/^app_test_/u);
    expect(
      long.startsWith(testDatabaseName(long).replace(suffix, ""))
    ).toBeTruthy();
  });

  it("randomizes the name", () => {
    expect(testDatabaseName("a".repeat(100))).not.toBe(
      testDatabaseName("a".repeat(100))
    );
  });
});
