import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "#src/generated/client.ts";

export const createDb = (url: string) =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

export type Database = ReturnType<typeof createDb>;
