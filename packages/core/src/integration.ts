import type { PackageManager } from "#/blueprint.ts";

export interface Kind {
  readonly id: string;
  readonly name: string;
  readonly optional: boolean;
  /** The choice a user who leaves the kind undecided gets; `null` is the empty choice. */
  readonly default?: string | null;
}

export type Stack = Readonly<Partial<Record<string, string>>>;

export interface Context {
  readonly packageManager?: PackageManager;
  readonly name: string;
  readonly scope: string;
  readonly stack: Stack;
  readonly addons: readonly string[];
  /** Whether the project includes the integration or add-on. Throws for an id the registry does not declare. */
  readonly has: (id: string) => boolean;
}

/** Slots key collected values by the `Context` object, which is unique to one `generate` call. */
export interface Slot<T> {
  readonly id: string;
  readonly add: (generation: Context, value: T) => void;
  readonly values: (generation: Context) => readonly T[];
}

export type ReadSlot = <T>(slot: Slot<T>) => readonly T[];

export type Contribution =
  | {
      readonly type: "file";
      readonly path: string;
      readonly render: (read: ReadSlot) => string;
    }
  | {
      readonly type: "slot";
      readonly slot: string;
      readonly add: (generation: Context) => void;
    };

export interface Integration {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  readonly description: string;
  /** The project's official site, linked from the integration on the map. Absent for vibestart's own glue, which has none. */
  readonly homepage?: string;
  /** Can be added to a project after creation without regenerating its business source. */
  readonly supportsAdd?: boolean;
  readonly provides: readonly string[];
  readonly requires: readonly string[];
  /** Chosen only to satisfy another integration's `requires`, so it is illegal when nothing requires what it provides. */
  readonly auxiliary: boolean;
  readonly contribute: (ctx: Context) => readonly Contribution[];
}

/** What the resolver reads of an integration: all of it but its contributions, so it serializes. */
export type IntegrationInfo = Omit<Integration, "contribute">;

/**
 * Tooling a project takes or leaves whatever its stack, several at a time. An add-on is no layer of the
 * stack, so it stays out of the stacks the resolver enumerates and verifies: a stack is verified with the
 * default add-ons, and leaving one out removes only its own steps from the project's checks.
 */
export interface Addon {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly homepage?: string;
  /** Can be added to a project after creation without regenerating its business source. */
  readonly supportsAdd?: boolean;
  /** Whether a project takes it unless it opts out. */
  readonly default: boolean;
  readonly contribute: (ctx: Context) => readonly Contribution[];
}

export type AddonInfo = Omit<Addon, "contribute">;

export const defineAddon = (addon: Addon): Addon => addon;

export const defineIntegration = ({
  auxiliary = false,
  provides = [],
  requires = [],
  ...integration
}: Omit<Integration, "auxiliary" | "provides" | "requires"> &
  Partial<
    Pick<Integration, "auxiliary" | "provides" | "requires">
  >): Integration => ({
  ...integration,
  auxiliary,
  provides,
  requires,
});

export const defineSlot = <T>(id: string): Slot<T> => {
  const collected = new WeakMap<Context, T[]>();
  return {
    add: (generation, value) => {
      const values = collected.get(generation) ?? [];
      values.push(value);
      collected.set(generation, values);
    },
    id,
    values: (generation) => collected.get(generation) ?? [],
  };
};

export const file = (path: string, content: string): Contribution => ({
  path,
  render: () => content,
  type: "file",
});

/** A file whose content depends on values other integrations contribute to slots. */
export const renderFile = (
  path: string,
  render: (read: ReadSlot) => string
): Contribution => ({ path, render, type: "file" });

export const contribute = <T>(
  slot: Slot<T>,
  value: NoInfer<T>
): Contribution => ({
  add: (generation) => {
    slot.add(generation, value);
  },
  slot: slot.id,
  type: "slot",
});
