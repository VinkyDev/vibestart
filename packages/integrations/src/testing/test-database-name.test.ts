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

// PostgreSQL allows 63 bytes and MySQL 64 characters; word characters read the same in SQL and URLs.
describe("testDatabaseName", () => {
  it.each([
    "app",
    "a".repeat(100),
    encodeURIComponent("数据库".repeat(40)),
    encodeURIComponent('a"b`c?d#e f%g'),
  ])(
    "names a word-character database within the limit for %s",
    (configured) => {
      expect(testDatabaseName(configured)).toMatch(
        /^\w{0,49}_test_[0-9a-f]{8}$/u
      );
    }
  );

  it("keeps a name that fits", () => {
    expect(testDatabaseName("my_app")).toMatch(/^my_app_test_/u);
  });

  it("randomizes the name", () => {
    expect(testDatabaseName("a".repeat(100))).not.toBe(
      testDatabaseName("a".repeat(100))
    );
  });
});
