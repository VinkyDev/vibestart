import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";

import { prepareVerification } from "./verification.ts";

vi.mock(import("node:child_process"));
vi.mock(import("node:fs"));

const archive = "test archive";
const artifact = {
  name: "verification-web",
  expired: false,
  archive_download_url: "https://api.github.com/archive.zip",
  digest: `sha256:${createHash("sha256").update(archive).digest("hex")}`,
  workflow_run: { id: 123, repository_id: 1, head_repository_id: 1 },
};

describe("Cloudflare build verification", () => {
  beforeEach(() => {
    vi.mocked(execFileSync).mockReturnValue("{}");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("does not fetch verification during local builds", async () => {
    vi.stubEnv("WORKERS_CI", "");
    const request = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", request);
    await prepareVerification();
    expect(request).not.toHaveBeenCalled();
  });

  it("requires a build secret before making network requests", async () => {
    vi.stubEnv("WORKERS_CI", "1");
    vi.stubEnv("GH_TOKEN", "");
    vi.stubEnv("GITHUB_TOKEN", "");
    const request = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", request);
    await expect(prepareVerification()).rejects.toThrow("Actions read");
    expect(request).not.toHaveBeenCalled();
  });

  it("embeds a same-repository CI artifact and verifies its archive digest", async () => {
    vi.stubEnv("WORKERS_CI", "1");
    vi.stubEnv("GH_TOKEN", "test-secret");
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(Response.json({ artifacts: [artifact] }))
        .mockResolvedValueOnce(
          Response.json({
            id: 123,
            event: "pull_request",
            path: ".github/workflows/ci.yml",
            head_repository: { full_name: "VinkyDev/vibestart" },
          })
        )
        .mockResolvedValueOnce(new Response(archive))
    );
    await prepareVerification();
    expect(execFileSync).toHaveBeenCalledWith(
      "unzip",
      expect.arrayContaining(["-p", "current.json"]),
      expect.any(Object)
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("verification/current.json"),
      "{}"
    );
  });

  it("excludes artifacts produced from fork code", async () => {
    vi.stubEnv("WORKERS_CI", "1");
    vi.stubEnv("GH_TOKEN", "test-secret");
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        artifacts: [
          {
            ...artifact,
            workflow_run: { ...artifact.workflow_run, head_repository_id: 2 },
          },
        ],
      })
    );
    vi.stubGlobal("fetch", request);
    await expect(prepareVerification()).rejects.toThrow("No complete");
    expect(request).toHaveBeenCalledOnce();
    expect(writeFileSync).not.toHaveBeenCalled();
  });
});
