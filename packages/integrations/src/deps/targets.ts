import type { ReleaseType } from "semver";
import {
  diff,
  gt,
  major,
  maxSatisfying,
  minVersion,
  prerelease,
  rcompare,
  valid,
} from "semver";

import type { Pin } from "#/deps/pins.ts";

export interface Packument {
  readonly distTags: Readonly<Record<string, string>>;
  readonly versions: Readonly<
    Record<
      string,
      {
        readonly deprecated?: string | undefined;
        readonly dependencies?: Readonly<Record<string, string>> | undefined;
      }
    >
  >;
}

export interface Releases {
  readonly packument: (name: string) => Packument;
  readonly nodeLts: string;
}

/** A package follows `latest`, a prerelease its channel, Node.js its LTS; the rest follow another pin. */
type Rule =
  | "latest"
  | "prerelease channel"
  | "Node.js LTS"
  | "Node.js major"
  | "vite-plus";

export interface Target {
  readonly name: string;
  readonly current: string;
  readonly target: string;
  readonly rule: Rule;
  readonly bump: ReleaseType | null;
  readonly deprecated: string | undefined;
  readonly ranges: ReadonlyMap<string, string>;
}

const rangePattern =
  /^(?<prefix>(?:npm:(?:@[^/@]+\/)?[^/@]+@)?[\^~]?)(?<version>\d\S*)$/u;

const split = (range: string) => {
  const { prefix = "", version = "" } = rangePattern.exec(range)?.groups ?? {};
  if (valid(version) === null) {
    throw new Error(`${range} is not a version behind ^, ~, or an npm: alias`);
  }
  return { prefix, version };
};

interface Follower {
  readonly source: string;
  readonly rule: Rule;
  readonly version: (source: string, releases: Releases) => string | undefined;
}

const followers: ReadonlyMap<string, Follower> = new Map([
  [
    // Its types describe one Node.js major, the one projects run.
    "@types/node",
    {
      rule: "Node.js major",
      source: "node",
      version: (node, releases) =>
        maxSatisfying(
          Object.keys(releases.packument("@types/node").versions),
          `${major(node)}.x`
        ) ?? undefined,
    },
  ],
  [
    // Vite+ formats with its own oxfmt, and generated files must pass the formatter projects check with.
    "oxfmt",
    {
      rule: "vite-plus",
      source: "vite-plus",
      version: (vitePlus, releases) => {
        const range =
          releases.packument("vite-plus").versions[vitePlus]?.dependencies
            ?.oxfmt;
        return range === undefined ? undefined : minVersion(range)?.version;
      },
    },
  ],
  [
    // `vite` resolves to the Vite+ core, so a plugin that imports `vite` gets the one Vite+ runs.
    "vite",
    {
      rule: "vite-plus",
      source: "vite-plus",
      version: (vitePlus, releases) => {
        const range =
          releases.packument("vite-plus").versions[vitePlus]?.dependencies
            ?.vite;
        return range === undefined ? undefined : split(range).version;
      },
    },
  ],
]);

/** A prerelease's channel: `1.0.0-rc.4` is on `rc.#`, which `1.0.0-rc.5` shares and `1.0.0-rc.5-ab785fc` does not. */
const channelOf = (version: string) =>
  prerelease(version)
    ?.join(".")
    .replaceAll(/(?<=^|\.)\d+(?=\.|$)/gu, "#");

const newest = (version: string, packument: Packument) => {
  const { latest } = packument.distTags;
  const stable =
    latest !== undefined && prerelease(latest) === null && gt(latest, version)
      ? latest
      : undefined;
  const channel = channelOf(version);
  if (channel === undefined) {
    return { rule: "latest" as const, version: stable ?? version };
  }
  const onChannel = Object.keys(packument.versions).filter(
    (candidate) => valid(candidate) !== null && channelOf(candidate) === channel
  );
  const [top = version] = [
    version,
    ...onChannel,
    ...(stable === undefined ? [] : [stable]),
  ].toSorted(rcompare);
  return { rule: "prerelease channel" as const, version: top };
};

const currentOf = (pin: Pin) =>
  [...pin.ranges.values()].toSorted((a, b) =>
    rcompare(split(a).version, split(b).version)
  )[0] ?? "";

/** `selected` limits the move to the pins it names; a follower moves with its pin. */
export const targetsOf = (
  pins: readonly Pin[],
  releases: Releases,
  selected: (name: string) => boolean = () => true
): readonly Target[] => {
  const targets = new Map<string, Target>();
  const settle = (pin: Pin, rule: Rule, next: string | undefined) => {
    const current = currentOf(pin);
    const { prefix, version } = split(current);
    const to = next ?? version;
    targets.set(pin.name, {
      bump: diff(version, to),
      current,
      deprecated:
        pin.name === "node" || prefix.startsWith("npm:")
          ? undefined
          : releases.packument(pin.name).versions[version]?.deprecated,
      name: pin.name,
      ranges: pin.ranges,
      rule,
      target: `${prefix}${to}`,
    });
  };

  for (const pin of pins.filter(({ name }) => !followers.has(name))) {
    const { version } = split(currentOf(pin));
    const { rule, version: next } =
      pin.name === "node"
        ? {
            rule: "Node.js LTS" as const,
            version: gt(releases.nodeLts, version) ? releases.nodeLts : version,
          }
        : newest(version, releases.packument(pin.name));
    settle(pin, rule, selected(pin.name) ? next : undefined);
  }
  for (const pin of pins) {
    const follower = followers.get(pin.name);
    if (follower === undefined) {
      continue;
    }
    const followed = targets.get(follower.source);
    if (followed === undefined) {
      throw new Error(
        `${pin.name} follows ${follower.source}, which no file pins`
      );
    }
    if (!selected(pin.name) && !selected(followed.name)) {
      settle(pin, follower.rule, undefined);
      continue;
    }
    const next = follower.version(split(followed.target).version, releases);
    if (next === undefined) {
      throw new Error(
        `No ${pin.name} goes with ${followed.name} ${followed.target}`
      );
    }
    settle(pin, follower.rule, next);
  }

  return pins.flatMap((pin) => targets.get(pin.name) ?? []);
};

export const isBehind = (target: Target) =>
  [...target.ranges.values()].some((range) => range !== target.target);
