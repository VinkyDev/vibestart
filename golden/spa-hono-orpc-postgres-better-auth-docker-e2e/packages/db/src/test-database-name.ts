// PostgreSQL truncates identifiers beyond 63 bytes (NAMEDATALEN - 1), counted in UTF-8.
const maxBytes = 63;

const encoder = new TextEncoder();

/** A random name for a test database beside `configured`, whose prefix is cut to fit the identifier limit. */
export const testDatabaseName = (configured: string) => {
  const suffix = `_test_${crypto.randomUUID().slice(0, 8)}`;
  let budget = maxBytes - suffix.length;
  let prefix = "";
  for (const character of configured) {
    budget -= encoder.encode(character).length;
    if (budget < 0) {
      break;
    }
    prefix += character;
  }
  return `${prefix}${suffix}`;
};
