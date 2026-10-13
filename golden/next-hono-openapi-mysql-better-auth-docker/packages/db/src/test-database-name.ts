// MySQL limits a database name to 64 characters.
const maxCharacters = 64;

/** A random name for a test database beside `configured`, whose prefix is cut to fit the identifier limit. */
export const testDatabaseName = (configured: string) => {
  const suffix = `_test_${crypto.randomUUID().slice(0, 8)}`;
  const prefix = Array.from(configured).slice(0, maxCharacters - suffix.length);
  return `${prefix.join("")}${suffix}`;
};
