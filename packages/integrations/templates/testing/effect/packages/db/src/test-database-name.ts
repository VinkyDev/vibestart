// ASCII keeps the quoted SQL identifier and URL consistent, within PostgreSQL's 63-byte limit.
export const testDatabaseName = (configured: string) =>
  `${configured.replaceAll(/\W/gu, "_").slice(0, 49)}_test_${crypto.randomUUID().slice(0, 8)}`;
