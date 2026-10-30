import { spawn } from "node:child_process";
import { once } from "node:events";
import {
  appendFileSync,
  closeSync,
  existsSync,
  openSync,
  readFileSync,
} from "node:fs";
import { arch, platform, release } from "node:os";
import path from "node:path";

import type { Stack } from "@vibestart/core";
import { fingerprint } from "@vibestart/core";

import { e2e, playwright } from "#/testing/runners.ts";
import type { Task } from "#/verification-store.ts";
import { writeRecords } from "#/verification-store.ts";
import type { Platform, StackVerification } from "#/verification.ts";
import { verification, verifiedGeneration } from "#/verification.ts";

import { print, projectEnv, writeEnvFiles, writeProject } from "./project.ts";

const logTail = (logFile: string, lines = 80) =>
  readFileSync(logFile, "utf-8").trimEnd().split("\n").slice(-lines).join("\n");

const environment = {
  arch: arch(),
  node: process.version,
  os: `${platform()} ${release()}`,
};

const hostPlatforms: Partial<Record<NodeJS.Platform, Platform>> = {
  linux: "linux",
  win32: "windows",
};

/** The platform whose records this machine's runs produce; elsewhere `verify` runs the Linux tasks and writes none. */
export const hostPlatform = hostPlatforms[platform()];

// Each stack's e2e runner takes a port for the web app and the next for a Hono server, so stacks sit 10 ports apart.
// From 20000 the range stays below the ephemeral ports of Linux (32768) and macOS (49152), which the operating system
// hands to outgoing connections, and clear of the ports `fetch` refuses.
const testPorts = (index: number) => ({
  E2E_TEST_PORT: String(20_000 + index * 10),
});

interface StackRun extends Task {
  force: boolean;
  index: number;
  out: string;
}

const browserRunners = new Map([
  ["e2e", e2e],
  ["playwright", playwright],
]);

/**
 * The README's first-run step for e2e tests. The project's own runner installs the browser, because the
 * build it needs follows the version that project resolved, which can trail the latest release.
 */
const browserInstall = (stack: Stack) => {
  const runner =
    stack.framework === undefined || stack.testing === undefined
      ? undefined
      : browserRunners.get(stack.testing);

  return runner === undefined
    ? []
    : [
        `cd ${path.join("apps", "web")} && vp exec ${runner.installer} install chromium && cd ${path.join("..", "..")}`,
      ];
};

export const verifyStack = async ({
  force,
  index,
  label,
  out,
  packageManager,
  platform: taskPlatform,
  stack,
}: StackRun) => {
  // The output this run writes is the output its record vouches for, so it is generated once and compared here.
  const generation = await verifiedGeneration(stack, packageManager);
  const hash = await fingerprint(generation);

  if (!force && verification[taskPlatform][label]?.fingerprint === hash) {
    print(`${label} verified at this output`);

    return true;
  }

  const dir = path.join(out, label);
  writeProject(dir, generation);
  writeEnvFiles(dir, generation);
  const logFile = `${dir}.log`;
  const log = openSync(logFile, "w");
  const started = Date.now();

  const commands = [
    "git init -q",
    ...generation.setup.map((command) => command.run),
    ...browserInstall(stack),
    `${packageManager} run ready`,
  ];

  const child = spawn(commands.join(" && "), {
    cwd: dir,
    env: { ...projectEnv, ...testPorts(index) },
    shell: true,
    stdio: ["ignore", log, log],
  });

  await once(child, "exit");
  closeSync(log);
  const passed = child.exitCode === 0;
  const seconds = Math.round((Date.now() - started) / 1000);

  if (!passed) {
    const serverLog = path.join(dir, "apps/web/.e2e/server.log");

    if (existsSync(serverLog)) {
      appendFileSync(
        logFile,
        `\nE2E server log:\n${readFileSync(serverLog, "utf-8")}`
      );
    }

    print(`${label} FAIL (${seconds}s), see ${logFile}`);
    // On CI the log file stays on the runner, so the reason has to reach the job output.
    print(logTail(logFile));

    return false;
  }

  print(`${label} PASS (${seconds}s)`);

  // After each stack, so an interrupted run keeps what it verified.
  if (hostPlatform !== undefined) {
    const record: StackVerification = {
      environment,
      fingerprint: hash,
      seconds,
      verifiedAt: new Date().toISOString(),
    };

    writeRecords(
      path.join(out, "results"),
      new Map([[`${hostPlatform}/${hash}`, record]])
    );
  }

  return true;
};
