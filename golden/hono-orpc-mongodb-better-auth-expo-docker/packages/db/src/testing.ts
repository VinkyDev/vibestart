import { createDb } from "#src/index.ts";
import { migrateDatabase } from "#src/migrate.ts";

/**
 * A database of its own beside `DATABASE_URL`'s, with its indexes built and dropped by `remove`. The random
 * name lets parallel test files, runners, and checkouts share one MongoDB server.
 */
export const createTestDatabase = async () => {
  const { DATABASE_URL } = process.env;
  if (DATABASE_URL === undefined) {
    throw new Error("DATABASE_URL is not set");
  }
  const url = new URL(DATABASE_URL);
  url.pathname = `${url.pathname}_test_${crypto.randomUUID().slice(0, 8)}`;

  const db = createDb(url.href);
  const remove = async () => {
    try {
      await db.connection.dropDatabase();
    } finally {
      await db.connection.close();
    }
  };
  try {
    await migrateDatabase(db);
  } catch (error) {
    await remove();
    throw error;
  }

  return { db, remove, url: url.href };
};
