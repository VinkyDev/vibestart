import type {
  GeneratedFile,
  GettingStartedStep,
  SetupCommand,
  Stack,
  Verification,
} from "@vibestart/core";

export interface Project {
  readonly packageManager?: "pnpm" | "bun";
  readonly files: readonly GeneratedFile[];
  readonly setup: readonly SetupCommand[];
  readonly gettingStarted: readonly GettingStartedStep[];
}

/** What a stack shows of the record that covers it before its preview loads: the task that passed, and when. */
export interface StackVerification {
  readonly label: string;
  readonly verifiedAt: string;
}

export interface StackEntry {
  readonly bunVerification?: StackVerification | null;
  readonly label: string;
  readonly stack: Stack;
  readonly verification: StackVerification | null;
}

/** Every legal stack; `verification` and `bunVerification` index `summaries`, which holds each summary once. */
export interface StackEntries {
  readonly stacks: readonly (Omit<
    StackEntry,
    "bunVerification" | "verification"
  > & {
    readonly bunVerification: number | null;
    readonly verification: number | null;
  })[];
  readonly summaries: readonly StackVerification[];
}

const addonsKey = (addons: readonly string[]) =>
  addons.length === 0 ? "none" : addons.join("+");

export const projectKey = (
  addons: readonly string[],
  packageManager: "pnpm" | "bun" = "pnpm"
) => `${packageManager === "bun" ? "bun:" : ""}${addonsKey(addons)}`;

interface PreviewProject extends Omit<Project, "files"> {
  readonly files: readonly (Omit<GeneratedFile, "content"> & {
    readonly content: number;
  })[];
}

/**
 * A stack's projects by `projectKey`; a file's `content` indexes `contents`, which holds each distinct content once.
 * `verification` is the stack's own pnpm record with the default add-ons.
 */
export interface StackPreview {
  readonly contents: readonly string[];
  readonly projects: Readonly<Record<string, PreviewProject>>;
  readonly verification: Verification[string] | null;
}

const previewDirectory = "previews/";

export const previewPath = (label: string) =>
  `${previewDirectory}${label}.json`;
