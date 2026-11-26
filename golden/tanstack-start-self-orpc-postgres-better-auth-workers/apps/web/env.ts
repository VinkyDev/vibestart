import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
});

export const readEnv = ({ HYPERDRIVE, ...bindings }: Cloudflare.Env) =>
  schema.parse({ ...bindings, DATABASE_URL: HYPERDRIVE.connectionString });
