import type { Database } from "#src/index.ts";

/**
 * MongoDB has no schema to migrate: this builds the indexes each model declares and drops the ones no model
 * declares any more.
 * Better Auth's collections get the indexes it queries by.
 */
export const migrateDatabase = async ({ connection }: Database) => {
  await connection.syncIndexes();
  const native = connection.getClient().db();
  await Promise.all([
    native.collection("user").createIndex({ email: 1 }, { unique: true }),
    native.collection("session").createIndex({ token: 1 }, { unique: true }),
    native.collection("session").createIndex({ userId: 1 }),
    native.collection("account").createIndex({ userId: 1 }),
    native.collection("verification").createIndex({ identifier: 1 }),
  ]);
};
