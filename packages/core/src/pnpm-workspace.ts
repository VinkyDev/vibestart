import { defineSlot } from "#/integration.ts";
import type { Catalog } from "#/registry.ts";

export interface PnpmWorkspaceContribution {
  readonly overrides?: Readonly<Record<string, string>>;
  readonly allowBuilds?: Readonly<Record<string, boolean>>;
  readonly peerDependencyRules?: {
    readonly allowAny?: readonly string[];
    readonly allowedVersions?: Readonly<Record<string, string>>;
  };
}

export const pnpmWorkspace =
  defineSlot<PnpmWorkspaceContribution>("pnpm-workspace");

const scalar = (value: string) =>
  /^[@*&!|>'"%`#,[\]{}?-]|:$|: | #/u.test(value) ? `"${value}"` : value;

const mapping = (
  entries: Readonly<Record<string, string | boolean>>,
  indent = "  "
) =>
  Object.entries(entries).map(
    ([key, value]) => `${indent}${scalar(key)}: ${scalar(String(value))}`
  );

const merged = <T>(
  records: readonly (Readonly<Record<string, T>> | undefined)[]
): Record<string, T> =>
  Object.fromEntries(records.flatMap((record) => Object.entries(record ?? {})));

const section = (lines: readonly string[]) => lines.join("\n");

export const renderPnpmWorkspace = ({
  packagePaths,
  catalog,
  usedDependencies,
  contributions,
}: {
  packagePaths: readonly string[];
  catalog: Catalog;
  usedDependencies: ReadonlySet<string>;
  contributions: readonly PnpmWorkspaceContribution[];
}) => {
  const globs = [
    ...new Set(
      packagePaths
        .filter((path) => path !== ".")
        .map((path) => `${path.split("/").slice(0, -1).join("/")}/*`)
    ),
  ].toSorted();

  const groups = Object.entries(catalog).flatMap(([group, versions]) => {
    const entries = Object.entries(versions)
      .filter(([dependency]) => usedDependencies.has(dependency))
      .toSorted(([a], [b]) => (a < b ? -1 : 1));
    return entries.length === 0
      ? []
      : [section([`  # ${group}`, ...mapping(Object.fromEntries(entries))])];
  });

  const overrides = merged(contributions.map((c) => c.overrides));
  const allowBuilds = merged(contributions.map((c) => c.allowBuilds));
  const allowAny = contributions.flatMap(
    (c) => c.peerDependencyRules?.allowAny ?? []
  );
  const allowedVersions = merged(
    contributions.map((c) => c.peerDependencyRules?.allowedVersions)
  );

  const sections = [
    section(["packages:", ...globs.map((glob) => `  - ${glob}`)]),
    "catalogMode: prefer",
    section(["catalog:", groups.join("\n\n")]),
  ];
  if (Object.keys(overrides).length > 0) {
    sections.push(section(["overrides:", ...mapping(overrides)]));
  }
  if (Object.keys(allowBuilds).length > 0) {
    sections.push(section(["allowBuilds:", ...mapping(allowBuilds)]));
  }
  if (allowAny.length > 0 || Object.keys(allowedVersions).length > 0) {
    sections.push(
      section([
        "peerDependencyRules:",
        ...(allowAny.length > 0
          ? ["  allowAny:", ...allowAny.map((name) => `    - ${scalar(name)}`)]
          : []),
        ...(Object.keys(allowedVersions).length > 0
          ? ["  allowedVersions:", ...mapping(allowedVersions, "    ")]
          : []),
      ])
    );
  }

  return `${sections.join("\n\n")}\n`;
};
