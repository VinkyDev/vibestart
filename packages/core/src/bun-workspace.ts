import type { PnpmWorkspaceContribution } from "#/pnpm-workspace.ts";
import type { Catalog } from "#/registry.ts";

/** Bun's workspace, catalog and install policy live in the root manifest. */
export const bunWorkspace = (
  packagePaths: readonly string[],
  catalog: Catalog,
  usedDependencies: ReadonlySet<string>,
  contributions: readonly PnpmWorkspaceContribution[]
) => {
  // Like pnpm, the last contribution owns the final allow/deny decision.
  const allowBuilds = Object.fromEntries(
    contributions.flatMap((part) => Object.entries(part.allowBuilds ?? {}))
  );
  return {
    workspaces: {
      packages: [
        ...new Set(
          packagePaths
            .filter((path) => path !== ".")
            .map((path) => `${path.split("/").slice(0, -1).join("/")}/*`)
        ),
      ].toSorted(),
      catalog: Object.fromEntries(
        Object.values(catalog)
          .flatMap(Object.entries)
          .filter(([name]) => usedDependencies.has(name))
          .toSorted(([a], [b]) => a.localeCompare(b))
      ),
    },
    overrides: Object.fromEntries(
      contributions.flatMap((part) =>
        Object.entries(part.overrides ?? {}).map(([name, version]) => [
          name.replace(/@\*$/u, ""),
          version,
        ])
      )
    ),
    // An explicit list also keeps esbuild's install script disabled, as on pnpm.
    trustedDependencies: [
      ...new Set([
        "vite-plus",
        ...Object.entries(allowBuilds)
          .filter(([, allowed]) => allowed)
          .map(([name]) => name),
      ]),
    ].toSorted(),
  };
};
