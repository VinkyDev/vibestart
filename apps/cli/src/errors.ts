import type { Change, Violation } from "@vibestart/core";

interface FlagFix {
  readonly changes: readonly Change[];
  readonly flags: readonly string[];
}

interface OpenKind {
  readonly kind: string;
  readonly options: readonly (string | null)[];
  readonly flags: readonly string[];
}

/** What went wrong, as the `--json` error reports it beside `message`. */
export type Failure =
  | {
      readonly code: "cancelled" | "invalid-option" | "invalid-recipe";
    }
  | {
      readonly code: "directory-not-empty";
      readonly directory: string;
    }
  | {
      readonly code: "illegal-stack";
      readonly violations: readonly Violation[];
      readonly fixes: readonly FlagFix[];
    }
  | {
      readonly code: "incomplete-stack";
      readonly stacks: number;
      readonly open: readonly OpenKind[];
    }
  | {
      readonly code: "step-failed";
      readonly directory: string;
      readonly run: string;
      readonly exitCode: number | undefined;
      readonly output: string;
    };

/** An expected failure: `message` is for people, `failure` is for `--json`. */
export class CliError extends Error {
  readonly failure: Failure;

  constructor(failure: Failure, message: string) {
    super(message);
    this.name = "CliError";
    this.failure = failure;
  }
}
