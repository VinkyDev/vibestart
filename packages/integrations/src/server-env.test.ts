import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vite-plus/test";

import { materializeEnvFromExamples } from "#/server-env.ts";

describe(materializeEnvFromExamples, () => {
  let dir = "";

  afterEach(() => {
    if (dir !== "") {
      rmSync(dir, { force: true, recursive: true });
      dir = "";
    }
  });

  it("writes .env from .env.example with a generated auth secret", () => {
    dir = mkdtempSync(path.join(tmpdir(), "vs-env-"));
    mkdirSync(path.join(dir, "apps/server"), { recursive: true });
    writeFileSync(
      path.join(dir, "apps/server/.env.example"),
      "BETTER_AUTH_SECRET=replace-with-openssl-rand-base64-32-output\nPORT=3000\n"
    );
    materializeEnvFromExamples(dir, {
      authSecret: "abc123secret-is-long-enough-here",
    });
    expect(readFileSync(path.join(dir, "apps/server/.env"), "utf-8")).toBe(
      "BETTER_AUTH_SECRET=abc123secret-is-long-enough-here\nPORT=3000\n"
    );
  });
});
