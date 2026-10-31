// Word characters read the same in SQL and in every driver's URL parsing, and 49 of them with the
// suffix stay within PostgreSQL's 63 bytes and MySQL's 64 characters.
export const testDatabaseName = (configured: string) =>
  `${configured.replaceAll(/\W/gu, "_").slice(0, 49)}_test_${crypto.randomUUID().slice(0, 8)}`;
