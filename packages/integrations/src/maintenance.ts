import type { GeneratedFile } from "@vibestart/core";

/**
 * Business source is starter code. Only infrastructure has an ongoing template owner.
 * `vibestart.jsonc` is the CLI's record of the project, written rather than merged.
 */
export const maintenanceFiles = (files: readonly GeneratedFile[]) =>
  files.filter(
    ({ path, owner }) =>
      owner === "docker" ||
      (owner === "void" &&
        (path.endsWith("/void.config.ts") ||
          path.endsWith("/env.ts") ||
          path.endsWith("/worker-env.d.ts") ||
          path === "scripts/deploy.ts")) ||
      path === ".vite-hooks/pre-commit" ||
      /(?:^|\/)(?:package\.json|pnpm-workspace\.yaml|tsconfig(?:\.[\w-]+)?\.json|vite\.config\.ts|metro\.config\.ts|knip\.jsonc?|\.gitignore|\.npmrc|AGENTS\.md)$/u.test(
        path
      ) ||
      path.startsWith("packages/config/")
  );
