import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createDb } from "#src/index.ts";
import { migrateDatabase } from "#src/migrate.ts";

/** A migrated database of its own in a fresh temporary directory, deleted by `remove`. */
export const createTestDatabase = async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "my-app-test-"));
  const url = path.join(dir, "test.db");
  const db = createDb(url);
  migrateDatabase(db);

  return {
    db,
    remove: async () => {
      db.$client.close();
      await rm(dir, { force: true, maxRetries: 10, recursive: true });
    },
    url,
  };
};
