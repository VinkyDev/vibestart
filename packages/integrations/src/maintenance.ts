import type { GeneratedFile } from "@vibestart/core";

/**
 * Business source is starter code. Only infrastructure has an ongoing template owner.
 * `vibestart.jsonc` is the CLI's record of the project, written rather than merged.
 */
export const maintenanceFiles = (files: readonly GeneratedFile[]) =>
  files.filter(
    ({ path, owner }) =>
      owner === "docker" ||
      /(?:^|\/)(?:package\.json|pnpm-workspace\.yaml|tsconfig(?:\.[\w-]+)?\.json|vite\.config\.ts|knip\.jsonc?|\.gitignore|\.npmrc|\.node-version|\.bun-version|AGENTS\.md)$/u.test(
        path
      ) ||
      path.startsWith("packages/config/")
  );
