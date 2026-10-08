import { z } from "zod";

import type { Generation } from "#/generator.ts";

/** One platform's verification records for the current output, keyed by the stack's label. */
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

/**
 * SHA-256 of what `vp run ready` reads. Documentation is left out: `ready` reads none, and generation formats it
 * like every other file, so a wording change does not invalidate a verification.
 */
export const fingerprint = async ({
  files,
  setup,
}: Pick<Generation, "files" | "setup">) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(
      JSON.stringify({
        files: files.filter((file) => !file.path.endsWith(".md")),
        setup,
      })
    )
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
};
