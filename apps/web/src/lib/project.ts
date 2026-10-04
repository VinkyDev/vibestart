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

export interface StackSummary {
  readonly bunVerification?: StackVerification | null;
  readonly label: string;
  readonly stack: Stack;
  readonly verification: StackVerification | null;
}

export const addonsKey = (addons: readonly string[]) =>
  addons.length === 0 ? "none" : addons.join("+");

export interface StackEntry extends StackSummary {
  readonly projects: Readonly<Record<string, () => Promise<Project>>>;
}

export const projectKey = (
  addons: readonly string[],
  packageManager: "pnpm" | "bun" = "pnpm"
) => `${packageManager === "bun" ? "bun:" : ""}${addonsKey(addons)}`;
