import { existsSync, readdirSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { execa } from "execa";

import type { GeneratedFile } from "@vibestart/core";
import { projectNameError } from "@vibestart/core";

import { CliError } from "#/errors.ts";
import type { Ui } from "#/ui.ts";

export interface Target {
  /** Absolute. */
  readonly directory: string;
  readonly name: string;
}

export const targetOf = (input: string): Target => {
  const directory = path.resolve(input);
  return { directory, name: path.basename(directory) };
};

/** A project goes into a directory that is missing or empty, so nothing of the user's is overwritten. */
const nameError = (name: string) => {
  const error = projectNameError(name);
  return error === undefined
    ? undefined
    : `${error}. The directory's name is the project name.`;
};

const directoryError = (directory: string) =>
  existsSync(directory) &&
  (!statSync(directory).isDirectory() || readdirSync(directory).length > 0)
    ? `${directory} already exists and is not an empty directory.`
    : undefined;

export const targetError = ({ directory, name }: Target) =>
  nameError(name) ?? directoryError(directory);

export const assertTarget = ({ directory, name }: Target) => {
  const invalidName = nameError(name);
  if (invalidName !== undefined) {
    throw new CliError({ code: "invalid-option" }, invalidName);
  }
  const occupied = directoryError(directory);
  if (occupied !== undefined) {
    throw new CliError({ code: "directory-not-empty", directory }, occupied);
  }
};

export const writeFiles = async (
  directory: string,
  files: readonly GeneratedFile[]
) => {
  await Promise.all(
    files.map(async (file) => {
      const target = path.join(directory, file.path);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, file.content);
    })
  );
};

export const hasCommand = async (command: string) => {
  const result = await execa(command, ["--version"], { reject: false });
  return !result.failed;
};

export interface StepResult {
  readonly run: string;
  readonly seconds: number;
}

const outputTail = 40;

/**
 * Runs a shell command, streaming its output to the step view. With `localBin`, the
 * command finds the project's own binaries first, such as the `vp` of its `vite-plus`.
 */
export const runStep = async (
  ui: Ui,
  cwd: string,
  run: string,
  { localBin = false }: { readonly localBin?: boolean } = {}
): Promise<StepResult> => {
  const view = ui.step(run);
  const started = performance.now();
  const subprocess = execa(run, {
    all: true,
    cwd,
    preferLocal: localBin,
    reject: false,
    shell: true,
    stdin: "ignore",
  });
  for await (const line of subprocess.iterable({ from: "all" })) {
    view.line(line);
  }
  const result = await subprocess;
  const seconds = (performance.now() - started) / 1000;
  if (result.failed) {
    const output = result.all.split("\n").slice(-outputTail).join("\n");
    view.failed(output);
    throw new CliError(
      {
        code: "step-failed",
        directory: cwd,
        exitCode: result.exitCode,
        output,
        run,
      },
      `\`${run}\` failed in ${cwd} (exit code ${String(result.exitCode)}).`
    );
  }
  view.passed(seconds);
  return { run, seconds: Math.round(seconds * 10) / 10 };
};
