import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "#src/generated/client.ts";

// MySQL 8.4 signs in with caching_sha2_password, which sends a password over a connection without TLS only
// once the driver fetches the server's public key.
const withPublicKeyRetrieval = (url: string) => {
  const parsed = new URL(url);
  parsed.searchParams.set("allowPublicKeyRetrieval", "true");

  return parsed.href;
};

export const createDb = (url: string) =>
  new PrismaClient({
    adapter: new PrismaMariaDb(withPublicKeyRetrieval(url)),
  });

export type Database = ReturnType<typeof createDb>;
