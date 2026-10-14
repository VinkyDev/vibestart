const suffixBytes = "_test_".length + 8;

// Fits both MySQL's 64 characters and PostgreSQL's 63 bytes.
const maxBytes = 63;

const byteLength = (value: string) => new TextEncoder().encode(value).length;

export const testDatabaseName = (configured: string) => {
  let prefix = "";
  for (const character of configured) {
    if (byteLength(prefix + character) + suffixBytes > maxBytes) {
      break;
    }
    prefix += character;
  }
  return `${prefix}_test_${crypto.randomUUID().slice(0, 8)}`;
};
