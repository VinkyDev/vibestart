import { ShieldCheck, ShieldQuestion } from "lucide-react";
import { use } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import { FingerprintCheck } from "#/components/home/verification/fingerprint-check.tsx";
import { Steps } from "#/components/home/verification/steps.tsx";
import { gateOf } from "#/lib/gate.ts";
import { relativeTime } from "#/lib/i18n.ts";
import type { StackEntry, StackVerification } from "#/lib/project.ts";
import { loadProject } from "#/lib/projects.ts";
import { tintClass } from "#/lib/roles.ts";
import { chosen, decisions, e2eRunner } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const Status = ({
  verification,
}: {
  readonly verification: StackVerification | null;
}) =>
  verification === null ? (
    <span className="text-muted-foreground bg-muted flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs">
      <ShieldQuestion className="size-3.5" strokeWidth={1.75} />
      {m.not_verified()}
    </span>
  ) : (
    <span className="bg-added/10 text-added flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
      <ShieldCheck className="size-3.5" strokeWidth={1.75} />
      {m.gate_verified()}
    </span>
  );

const Technologies = ({ entry }: { readonly entry: StackEntry }) => (
  <ul className="text-muted-foreground flex flex-wrap gap-x-3.5 gap-y-1 text-xs">
    {decisions.map((kind) => {
      const integration =
        kind === "testing" ? e2eRunner(entry.stack) : chosen(entry.stack, kind);
      return (
        integration !== undefined && (
          <li
            className={cn(tintClass[kind], "flex items-center gap-1.5")}
            key={kind}
          >
            <span className="bg-tint size-1.5 rounded-full" />
            {integration.name}
          </li>
        )
      );
    })}
  </ul>
);

export const Record = ({
  entry,
  subject,
}: {
  readonly entry: StackEntry;
  readonly subject: StackEntry;
}) => {
  const project = use(loadProject(subject));
  const gate = gateOf(project);
  const { verification } = entry;

  return (
    <div className="flex flex-col gap-7 p-6 sm:p-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Status verification={verification} />
          {verification !== null && (
            <p
              className="text-muted-foreground text-xs tabular-nums"
              title={`${verification.environment.os} ${verification.environment.arch} · Node ${verification.environment.node}`}
            >
              {m.gate_passed({
                seconds: verification.seconds,
                when: relativeTime(verification.verifiedAt),
              })}
            </p>
          )}
        </div>
        <Technologies entry={entry} />
      </div>

      <Steps gate={gate} passed={verification !== null} />

      {verification !== null && (
        <FingerprintCheck
          key={subject.label}
          project={project}
          recorded={verification.fingerprint}
        />
      )}
    </div>
  );
};

export const Placeholder = () => (
  <div className="flex flex-col gap-4 p-6 sm:p-8">
    {["w-1/4", "w-2/3", "w-full", "w-5/6", "w-11/12", "w-3/4", "w-4/5"].map(
      (width) => (
        <span
          className={cn("bg-muted h-4 animate-pulse rounded-full", width)}
          key={width}
        />
      )
    )}
  </div>
);
