import { z } from "zod";

import { verificationSchema } from "@vibestart/core";
import type { Verification } from "@vibestart/core";

/** Every stack is covered on Linux; the goldens are also verified on Windows. */
export const platforms = ["linux", "windows"] as const;

export type Platform = (typeof platforms)[number];

/** For each verified stack's task label, its fingerprint when the store was read and the task whose record covers it. */
const coverageSchema = z.record(
  z.string(),
  z.strictObject({ by: z.string(), fingerprint: z.string() })
);

/** Each platform's records for the current output by task label, and the Linux tasks they cover. */
export const projectionSchema = z.strictObject({
  coverage: z.strictObject({ bun: coverageSchema, pnpm: coverageSchema }),
  linux: verificationSchema,
  windows: verificationSchema,
});

export type Projection = z.infer<typeof projectionSchema>;

export const emptyProjection = (): Projection => ({
  coverage: { bun: {}, pnpm: {} },
  linux: {},
  windows: {},
});

export type StackVerification = Verification[string];
