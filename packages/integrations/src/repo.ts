import { fileURLToPath } from "node:url";

/** The repository root, with a trailing slash. */
export const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
