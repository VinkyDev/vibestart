import type { PackageManager } from "#/blueprint.ts";
import { bunWorkspace } from "#/bun-workspace.ts";
import type { ReadSlot } from "#/integration.ts";
import { defineSlot } from "#/integration.ts";
import type { PnpmWorkspaceContribution } from "#/pnpm-workspace.ts";
import type { Catalog } from "#/registry.ts";

type Entries = Readonly<Record<string, string>>;

export interface PackageJsonContribution {
  /** Workspace-relative directory; `.` is the root. The package name is `<scope>/<basename>`. */
  readonly path: string;
  /** The entry point, for an app a runtime loads by reading `package.json`, such as Electron. */
  readonly main?: string;
  readonly imports?: Entries;
  readonly exports?: Entries;
  readonly scripts?: Entries;
  /** Scripts whose command is assembled from slot values when the manifest is rendered. */
  readonly derivedScripts?: Readonly<
    Record<string, (read: ReadSlot) => string>
  >;
  /** Package names. Workspace packages resolve to `workspace:*`, everything else to `catalog:`. */
  readonly dependencies?: readonly string[];
  readonly devDependencies?: readonly string[];
  readonly peerDependencies?: readonly string[];
  readonly devEngines?: DevEngines;
  readonly engines?: Entries;
}

interface DevEngines {
  readonly packageManager: {
    readonly name: string;
    readonly version: string;
    readonly onFail: "download" | "error" | "warn" | "ignore";
  };
}

export const packageJson = defineSlot<PackageJsonContribution>("package-json");

interface Package {
  readonly path: string;
  main: string | undefined;
  readonly imports: Map<string, string>;
  readonly exports: Map<string, string>;
  readonly scripts: Map<string, (read: ReadSlot) => string>;
  readonly engines: Map<string, string>;
  readonly dependencies: Set<string>;
  readonly devDependencies: Set<string>;
  readonly peerDependencies: Set<string>;
  devEngines: DevEngines | undefined;
}

const setOnce = <T>(
  target: Map<string, T>,
  entries: readonly (readonly [string, T])[],
  where: string
) => {
  for (const [key, value] of entries) {
    if (target.has(key)) {
      throw new Error(`${where}: "${key}" is contributed twice`);
    }
    target.set(key, value);
  }
};

const collectPackages = (contributions: readonly PackageJsonContribution[]) => {
  const packages = new Map<string, Package>();
  for (const contribution of contributions) {
    const pkg = packages.get(contribution.path) ?? {
      dependencies: new Set(),
      devDependencies: new Set(),
      devEngines: undefined,
      engines: new Map(),
      exports: new Map(),
      imports: new Map(),
      main: undefined,
      path: contribution.path,
      peerDependencies: new Set(),
      scripts: new Map(),
    };
    packages.set(contribution.path, pkg);
    const where = `${contribution.path}/package.json`;

    if (contribution.main !== undefined) {
      if (pkg.main !== undefined) {
        throw new Error(`${where}: main is contributed twice`);
      }
      pkg.main = contribution.main;
    }
    setOnce(pkg.imports, Object.entries(contribution.imports ?? {}), where);
    setOnce(pkg.exports, Object.entries(contribution.exports ?? {}), where);
    setOnce(pkg.engines, Object.entries(contribution.engines ?? {}), where);
    setOnce(
      pkg.scripts,
      Object.entries(contribution.scripts ?? {}).map(
        ([key, command]) => [key, () => command] as const
      ),
      where
    );
    setOnce(
      pkg.scripts,
      Object.entries(contribution.derivedScripts ?? {}),
      where
    );
    for (const name of contribution.dependencies ?? []) {
      pkg.dependencies.add(name);
    }
    for (const name of contribution.devDependencies ?? []) {
      pkg.devDependencies.add(name);
    }
    for (const name of contribution.peerDependencies ?? []) {
      pkg.peerDependencies.add(name);
    }
    if (contribution.devEngines !== undefined) {
      if (pkg.devEngines !== undefined) {
        throw new Error(`${where}: devEngines is contributed twice`);
      }
      pkg.devEngines = contribution.devEngines;
    }
  }
  return [...packages.values()];
};

export interface RenderedPackage {
  readonly path: string;
  readonly content: string;
  /** Catalog package names this manifest references. */
  readonly catalogDependencies: readonly string[];
}

export const renderPackageJsons = (
  contributions: readonly PackageJsonContribution[],
  {
    name,
    scope,
    catalog,
    read,
    packageManager = "pnpm",
    workspaceContributions = [],
  }: {
    name: string;
    scope: string;
    catalog: Catalog;
    read: ReadSlot;
    packageManager?: PackageManager;
    workspaceContributions?: readonly PnpmWorkspaceContribution[];
  }
): RenderedPackage[] => {
  const catalogNames = new Set(
    Object.values(catalog).flatMap((group) => Object.keys(group))
  );
  const packages = collectPackages(contributions);
  const packageName = (path: string) =>
    path === "." ? name : `${scope}/${path.split("/").at(-1)}`;
  const workspaceNames = new Set(
    packages
      .filter((pkg) => pkg.path !== ".")
      .map((pkg) => packageName(pkg.path))
  );

  const rendered = packages.map((pkg) => {
    const used = new Set<string>();
    const spec = (dependency: string) => {
      if (workspaceNames.has(dependency)) {
        return "workspace:*";
      }
      if (!catalogNames.has(dependency)) {
        throw new Error(
          `${pkg.path}/package.json depends on "${dependency}", which is neither a workspace package nor in the catalog`
        );
      }
      used.add(dependency);
      return "catalog:";
    };
    // A runtime dependency already satisfies a development-time one.
    const devDependencies = new Set(
      [...pkg.devDependencies].filter(
        (dependency) => !pkg.dependencies.has(dependency)
      )
    );
    const specs = (names: ReadonlySet<string>) =>
      Object.fromEntries(
        [...names]
          .toSorted()
          .map((dependency) => [dependency, spec(dependency)])
      );
    const scripts = new Map(
      [...pkg.scripts].map(([key, render]) => [key, render(read)])
    );

    // The field order oxfmt's package.json sorting keeps.
    const fields: [string, unknown, boolean][] = [
      ["name", packageName(pkg.path), true],
      ["version", "0.0.0", true],
      ["private", true, true],
      ["type", "module", true],
      ["main", pkg.main, pkg.main !== undefined],
      ["imports", Object.fromEntries(pkg.imports), pkg.imports.size > 0],
      ["exports", Object.fromEntries(pkg.exports), pkg.exports.size > 0],
      ["scripts", Object.fromEntries(scripts), scripts.size > 0],
      ["dependencies", specs(pkg.dependencies), pkg.dependencies.size > 0],
      ["devDependencies", specs(devDependencies), devDependencies.size > 0],
      [
        "peerDependencies",
        specs(pkg.peerDependencies),
        pkg.peerDependencies.size > 0,
      ],
      ["devEngines", pkg.devEngines, pkg.devEngines !== undefined],
      ["engines", Object.fromEntries(pkg.engines), pkg.engines.size > 0],
    ];
    const manifest = Object.fromEntries(
      fields.filter((field) => field[2]).map(([key, value]) => [key, value])
    );

    return {
      catalogDependencies: [...used],
      manifest,
      path: pkg.path === "." ? "package.json" : `${pkg.path}/package.json`,
    };
  });
  const root = rendered.find((pkg) => pkg.path === "package.json");
  if (packageManager === "bun" && root !== undefined) {
    Object.assign(
      root.manifest,
      bunWorkspace(
        packages.map((pkg) => pkg.path),
        catalog,
        new Set(rendered.flatMap((pkg) => pkg.catalogDependencies)),
        workspaceContributions
      )
    );
  }
  return rendered.map(({ manifest, ...pkg }) => ({
    ...pkg,
    content: `${JSON.stringify(manifest, null, 2)}\n`,
  }));
};
