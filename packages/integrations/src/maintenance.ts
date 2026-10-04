import type { GeneratedFile } from "@vibestart/core";

/** Business source is starter code. Only infrastructure has an ongoing template owner. */
export const maintenanceFiles = (files: readonly GeneratedFile[]) =>
  files.filter(
    ({ path, owner }) =>
      owner === "docker" ||
      /(?:^|\/)(?:package\.json|pnpm-workspace\.yaml|tsconfig(?:\.[\w-]+)?\.json|vite\.config\.ts|knip\.jsonc?|vibestart\.jsonc|\.gitignore|\.npmrc|\.node-version|\.bun-version|AGENTS\.md)$/u.test(
        path
      ) ||
      path.startsWith("packages/config/")
  );
