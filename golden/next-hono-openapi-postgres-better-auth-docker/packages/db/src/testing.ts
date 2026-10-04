import { createDb } from "#src/index.ts";
import { migrateDatabase } from "#src/migrate.ts";

const runAsAdmin = async (adminUrl: URL, statement: string) => {
  const admin = createDb(adminUrl.href);
  await admin.$client.unsafe(statement);
  await admin.$client.end();
};

/**
 * A migrated database of its own beside `DATABASE_URL`, dropped by `remove`. The random name lets
 * parallel test files, runners, and checkouts share one PostgreSQL server.
 */
export const createTestDatabase = async () => {
  const { DATABASE_URL } = process.env;
  if (DATABASE_URL === undefined) {
    throw new Error("DATABASE_URL is not set");
  }
  const adminUrl = new URL(DATABASE_URL);
  const url = new URL(adminUrl);
  url.pathname = `${adminUrl.pathname}_test_${crypto.randomUUID().slice(0, 8)}`;
  const name = url.pathname.slice(1);

  await runAsAdmin(adminUrl, `create database "${name}"`);
  const db = createDb(url.href);
  await migrateDatabase(db);

  return {
    db,
    remove: async () => {
      await db.$client.end();
      await runAsAdmin(adminUrl, `drop database "${name}" with (force)`);
    },
    url: url.href,
  };
};
