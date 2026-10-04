import type { OxfmtConfig } from "oxfmt";

import type { ReadSlot } from "@vibestart/core";
import { defineSlot } from "@vibestart/core";

export const lintPresets = defineSlot<{ name: string; module: string }>(
  "vite-plus/lint-presets"
);

export const fmtPresets = defineSlot<{
  name: string;
  module: string;
  config: OxfmtConfig;
}>("vite-plus/fmt-presets");

export const lintPlugins = defineSlot<{
  name: string;
  specifier: string;
  comment?: string;
}>("vite-plus/lint-plugins");

/** `note` is appended to the AGENTS.md Generated convention. */
export const generatedFiles = defineSlot<{
  glob: string;
  label?: string;
  note?: string;
}>("vite-plus/generated-files");

export const vendoredFiles = defineSlot<string>("vite-plus/vendored-files");

export const lintOverrides = defineSlot<string>("vite-plus/lint-overrides");

/** A Vitest project beside `unit`, whose tests read the `.env` in `envDir` into `process.env`. */
export interface TestProject {
  name: string;
  include: string;
  envDir: string;
}

export const testProjects = defineSlot<TestProject>("vite-plus/test-projects");

export const unitTestSources = defineSlot<string>(
  "vite-plus/unit-test-sources"
);

export const ignoredFiles = defineSlot<string>("vite-plus/ignored-files");

/** `prepare` runs before `vp check`, `analyze` before `vp test`, `verify` after it. */
export interface ReadyStep {
  phase: "prepare" | "analyze" | "verify";
  command: string;
  label: string;
  description: string;
}

export const readySteps = defineSlot<ReadyStep>("vite-plus/ready-steps");

export const agentsMap = defineSlot<{ path: string; owns: string }>(
  "vite-plus/agents-map"
);

export const agentsNotes = defineSlot<string>("vite-plus/agents-notes");

export const agentsConventions = defineSlot<{ title: string; text: string }>(
  "vite-plus/agents-conventions"
);

export const toolConventions = defineSlot<{ title: string; text: string }>(
  "vite-plus/tool-conventions"
);

export const agentsSections = defineSlot<string>("vite-plus/agents-sections");

export const readmeTagline = defineSlot<string>("vite-plus/readme-tagline");

export const readmeLayers = defineSlot<{ layer: string; choice: string }>(
  "vite-plus/readme-layers"
);

export const readmeOpen = defineSlot<string>("vite-plus/readme-open");

export const readmeCommandNotes = defineSlot<string>(
  "vite-plus/readme-command-notes"
);

export const readmeSections = defineSlot<(read: ReadSlot) => string>(
  "vite-plus/readme-sections"
);
