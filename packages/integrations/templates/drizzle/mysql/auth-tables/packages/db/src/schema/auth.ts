import {
  boolean,
  index,
  snakeCase,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// MySQL indexes a bounded column only, so ids, keys, and lookups are `varchar`.
const id = () => varchar({ length: 36 });

const timestamps = {
  createdAt: timestamp({ fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp({ fsp: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const user = snakeCase.table("user", {
  email: varchar({ length: 255 }).notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  id: id().primaryKey(),
  image: text(),
  name: text().notNull(),
  ...timestamps,
});

export const session = snakeCase.table(
  "session",
  {
    expiresAt: timestamp({ fsp: 3 }).notNull(),
    id: id().primaryKey(),
    ipAddress: text(),
    token: varchar({ length: 255 }).notNull().unique(),
    userAgent: text(),
    userId: id()
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
    accessTokenExpiresAt: timestamp({ fsp: 3 }),
    accountId: text().notNull(),
    id: id().primaryKey(),
    idToken: text(),
    password: text(),
    providerId: text().notNull(),
    refreshToken: text(),
    refreshTokenExpiresAt: timestamp({ fsp: 3 }),
    scope: text(),
    userId: id()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [index("account_user_id_idx").on(table.userId)]
);

export const verification = snakeCase.table(
  "verification",
  {
    expiresAt: timestamp({ fsp: 3 }).notNull(),
    id: id().primaryKey(),
    identifier: varchar({ length: 255 }).notNull(),
    value: text().notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);
