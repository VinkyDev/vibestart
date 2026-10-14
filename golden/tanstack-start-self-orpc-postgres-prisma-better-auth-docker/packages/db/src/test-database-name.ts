const encoder = new TextEncoder();

export const testDatabaseName = (configured: string) => {
  const suffix = `_test_${crypto.randomUUID().slice(0, 8)}`;
  let prefix = "";
  for (const character of configured) {
    // PostgreSQL's 63-byte limit also keeps MySQL under its 64 characters.
    if (encoder.encode(prefix + character + suffix).length > 63) {
      break;
    }
    prefix += character;
  }
  return prefix + suffix;
};
