import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

// Release runs `stacks pull`, checks every stack, and attaches the projection. The Studio embeds that
// file. Generating here would format every stack to reproduce it.
const repository = "VinkyDev/vibestart";

const root = fileURLToPath(new URL("../../..", import.meta.url));

const versionSchema = z.object({ version: z.string().min(1) });

const projectionSchema = z.object({
  coverage: z.unknown(),
  linux: z.unknown(),
  windows: z.unknown(),
});

const versionOf = (file: string) => {
  const parsed = versionSchema.safeParse(
    JSON.parse(readFileSync(file, "utf-8"))
  );

  if (!parsed.success) {
    throw new Error(`${file} has no version`, { cause: parsed.error });
  }

  return parsed.data.version;
};

const tag = `v${versionOf(path.join(root, "apps/cli/package.json"))}`;
const url = `https://github.com/${repository}/releases/download/${tag}/verification.json`;
const response = await fetch(url);

if (!response.ok) {
  throw new Error(
    `Release ${tag} has no verification.json (${response.status})`
  );
}

const body = Buffer.from(await response.arrayBuffer());
const parsed = projectionSchema.safeParse(JSON.parse(body.toString("utf-8")));

if (!parsed.success) {
  throw new Error(
    `Release ${tag} attached a file that is not the verification projection`,
    { cause: parsed.error }
  );
}

writeFileSync(path.join(root, "packages/integrations/verification.json"), body);
