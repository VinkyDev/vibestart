import type { PackageManager, Stack } from "@vibestart/core";
import { registry } from "@vibestart/integrations";
import type { VerificationMatch } from "@vibestart/integrations";
import { hasWebApp } from "@vibestart/integrations/app-shape";

const relativeTime = (iso: string) => {
  const seconds = (Date.parse(iso) - Date.now()) / 1000;
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const units = [
    ["day", 86_400],
    ["hour", 3600],
    ["minute", 60],
  ] as const;

  const [unit, size] = units.find(
    ([, length]) => Math.abs(seconds) >= length
  ) ?? ["second", 1];

  return format.format(Math.round(seconds / size), unit);
};

const testRows = (stack: Stack, kind: string, runner: string) => [
  ["Unit & integration tests", "Vitest"],
  ...(hasWebApp(stack) ? [[kind, runner]] : []),
];

export const stackSummary = (
  stack: Stack,
  addons: readonly string[],
  verification: VerificationMatch["record"] | undefined,
  packageManager: PackageManager
) => {
  const rows = [
    ...registry.kinds.flatMap((kind) => {
      const integration = registry.integrations.find(
        (candidate) => candidate.id === stack[kind.id]
      );

      if (integration === undefined) {
        return [];
      }

      return kind.id === "testing"
        ? testRows(stack, kind.name, integration.name)
        : [[kind.name, integration.name]];
    }),
    ["Package manager", packageManager],
    [
      "Extensions",
      registry.addons
        .filter((addon) => addons.includes(addon.id))
        .map((addon) => addon.name)
        .join(", ") || "None",
    ],
  ];

  const width = Math.max(...rows.map(([kind = ""]) => kind.length));

  return [
    ...rows.map(([kind = "", name = ""]) => `${kind.padEnd(width)}  ${name}`),
    "",
    "✓ Compatible",
    verification === undefined
      ? "! Not verified at this version; run `vp run ready` in the project"
      : `✓ Verified ${relativeTime(verification.verifiedAt)}: \`vp run ready\` passed on ${verification.environment.os} ${verification.environment.arch}, Node ${verification.environment.node}`,
  ].join("\n");
};

export const nextStepsText = (steps: readonly NextStep[]) => {
  const width = Math.max(
    ...steps.map((step) => (step.note === undefined ? 0 : step.run.length))
  );

  return steps
    .map((step) =>
      step.note === undefined
        ? step.run
        : `${step.run.padEnd(width)}   # ${step.note}`
    )
    .join("\n");
};

export interface NextStep {
  readonly run: string;
  readonly note?: string | undefined;
}
