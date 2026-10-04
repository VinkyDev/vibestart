import { sql } from "drizzle-orm";
import { index, integer, snakeCase, text } from "drizzle-orm/sqlite-core";

const now = sql`(cast(unixepoch('subsec') * 1000 as integer))`;

const timestamp = () => integer({ mode: "timestamp_ms" });

const timestamps = {
  createdAt: timestamp().notNull().default(now),
  updatedAt: timestamp()
    .notNull()
    .default(now)
    .$onUpdate(() => new Date()),
};

export const user = snakeCase.table("user", {
  email: text().notNull().unique(),
  emailVerified: integer({ mode: "boolean" }).notNull().default(false),
  id: text().primaryKey(),
  image: text(),
  name: text().notNull(),
  ...timestamps,
});

export const session = snakeCase.table(
  "session",
  {
    expiresAt: timestamp().notNull(),
    id: text().primaryKey(),
    ipAddress: text(),
    token: text().notNull().unique(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [index("session_user_id_idx").on(table.userId)]
);

export const account = snakeCase.table(
  "account",
  {
    accessToken: text(),
    accessTokenExpiresAt: timestamp(),
    accountId: text().notNull(),
    id: text().primaryKey(),
    idToken: text(),
    password: text(),
    providerId: text().notNull(),
    refreshToken: text(),
    refreshTokenExpiresAt: timestamp(),
    scope: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [index("account_user_id_idx").on(table.userId)]
);

export const verification = snakeCase.table(
  "verification",
  {
    expiresAt: timestamp().notNull(),
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);
