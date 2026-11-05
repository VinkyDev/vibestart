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
    native
      .collection("user")
      .createIndexes([{ key: { email: 1 }, unique: true }]),
    native
      .collection("session")
      .createIndexes([
        { key: { token: 1 }, unique: true },
        { key: { userId: 1 } },
      ]),
    native.collection("account").createIndexes([{ key: { userId: 1 } }]),
    native
      .collection("verification")
      .createIndexes([{ key: { identifier: 1 } }]),
  ]);
};
