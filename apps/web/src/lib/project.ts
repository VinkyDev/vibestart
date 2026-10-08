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

export type StackVerification = Verification[string] & {
  readonly label: string;
};

export interface StackEntry {
  readonly bunVerification?: StackVerification | null;
  readonly label: string;
  readonly stack: Stack;
  readonly verification: StackVerification | null;
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

/** A stack's projects by `projectKey`; a file's `content` indexes `contents`, which holds each distinct content once. */
export interface StackPreview {
  readonly contents: readonly string[];
  readonly projects: Readonly<Record<string, PreviewProject>>;
}

export const previewDirectory = "previews/";

export const previewPath = (label: string) =>
  `${previewDirectory}${label}.json`;
