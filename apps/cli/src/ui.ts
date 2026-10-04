import { styleText } from "node:util";

import { intro, log, note, outro, taskLog } from "@clack/prompts";

import type { CliError } from "#/errors.ts";

interface StepView {
  line: (text: string) => void;
  passed: (seconds: number) => void;
  failed: (output: string) => void;
}

/** What a run shows. `--json` shows nothing until the one JSON object at the end. */
export interface Ui {
  intro: (title: string) => void;
  note: (title: string, body: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  step: (title: string) => StepView;
  outro: (message: string) => void;
  error: (error: CliError) => void;
}

const quiet = () => {
  // `--json` reports through its result object.
};

export const jsonUi: Ui = {
  error: quiet,
  info: quiet,
  intro: quiet,
  note: quiet,
  outro: quiet,
  step: () => ({ failed: quiet, line: quiet, passed: quiet }),
  warn: quiet,
};

const elapsed = (seconds: number) => styleText("dim", `${seconds.toFixed(1)}s`);

/** A terminal shows each command's output live and clears it on success; a pipe gets one line per step. */
export const humanUi = (live: boolean): Ui => ({
  error: (error) => {
    log.error(error.message);
    outro(styleText("red", "Stopped."));
  },
  info: (message) => {
    log.info(message);
  },
  intro: (title) => {
    intro(styleText("inverse", ` ${title} `));
  },
  note: (title, body) => {
    note(body, title);
  },
  outro: (message) => {
    outro(message);
  },
  step: (title) => {
    if (live) {
      const task = taskLog({ limit: 12, title });
      return {
        failed: () => {
          task.error(`${title} failed`, { showLog: true });
        },
        line: (text) => {
          task.message(text);
        },
        passed: (seconds) => {
          task.success(`${title} ${elapsed(seconds)}`);
        },
      };
    }
    log.step(title);
    return {
      failed: (output) => {
        log.error(`${title} failed:\n${output}`);
      },
      line: quiet,
      passed: (seconds) => {
        log.success(`${title} ${elapsed(seconds)}`);
      },
    };
  },
  warn: (message) => {
    log.warn(message);
  },
});
