import { z } from "zod";

import type { Generation } from "#/generator.ts";

/** Build-time verification evidence, keyed by the canonical stack label. */
export const verificationSchema = z.record(
  z.string(),
  z.strictObject({
    environment: z.strictObject({
      arch: z.string(),
      node: z.string(),
      os: z.string(),
    }),
    /** `fingerprint` of the generation that passed. A stack whose output has changed since is unverified. */
    fingerprint: z.string(),
    seconds: z.number().int().nonnegative(),
    verifiedAt: z.iso.datetime(),
  })
);

export type Verification = z.infer<typeof verificationSchema>;

export const fingerprint = async ({
  files,
  setup,
}: Pick<Generation, "files" | "setup">) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify({ files, setup }))
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
};
