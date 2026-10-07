import { ParaglideMessage } from "@inlang/paraglide-js-react";
import { ShieldCheck, ShieldQuestion } from "lucide-react";
import type { ReactNode } from "react";

import { maxProjectNameLength, projectNameError } from "@vibestart/core";

import { CreateTerminal } from "#/components/create-terminal.tsx";
import { Segmented } from "#/components/segmented.tsx";
import { noteText, relativeTime } from "#/lib/i18n.ts";
import type { Project, StackEntry, StackVerification } from "#/lib/project.ts";
import type { PackageRunner } from "#/lib/stack.ts";
import { commandWords, flagsOf, verificationWith } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const runnerOptions = (
  ["pnpm", "bun"] as const satisfies readonly PackageRunner[]
).map((runner) => ({
  label: runner === "bun" ? "Bun" : runner,
  value: runner,
}));

const verifiedMarkup = {
  code: ({ children }: { readonly children?: ReactNode }) => (
    <code className="text-foreground/80 font-mono">{children}</code>
  ),
};

export const Verified = ({
  verification,
}: {
  readonly verification: StackVerification | null;
}) =>
  verification === null ? (
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <ShieldQuestion className="size-4" strokeWidth={1.75} />
      {m.not_verified()}
    </span>
  ) : (
    <span className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-xs">
      <ShieldCheck className="text-added size-4" strokeWidth={1.75} />
      <span className="text-foreground font-medium">
        {m.verified({ when: relativeTime(verification.verifiedAt) })}
      </span>
      <ParaglideMessage markup={verifiedMarkup} message={m.verified_passed} />
    </span>
  );

export const Command = ({
  addons,
  entry,
  name,
  onName,
  project,
  packageManager,
  onPackageManager,
}: {
  readonly packageManager: "pnpm" | "bun";
  readonly onPackageManager: (value: "pnpm" | "bun") => void;
  readonly addons: readonly string[];
  readonly entry: StackEntry;
  readonly name: string;
  readonly onName: (name: string) => void;
  readonly project: Project | null;
}) => {
  const nameError = projectNameError(name);
  const words = commandWords(
    flagsOf(entry.stack),
    name,
    packageManager,
    addons,
    packageManager
  );
  const steps =
    project === null
      ? []
      : [
          { run: `cd ${name}` },
          ...project.gettingStarted,
          { run: "vp run dev" },
        ];

  return (
    <section className="flex flex-col gap-4 p-5 pb-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-headline text-xl leading-none">{m.create_it()}</h2>
        <Segmented
          className="grid w-36 auto-cols-fr grid-flow-col"
          id="package-manager"
          label={m.package_manager()}
          onChange={onPackageManager}
          options={runnerOptions}
          value={packageManager}
        />
      </div>

      <CreateTerminal
        words={words}
        name={name}
        onName={onName}
        invalid={nameError !== undefined}
      />
      {nameError !== undefined && (
        <p className="text-removed text-xs" role="alert">
          {m.project_name_invalid({ max: maxProjectNameLength, name })}
        </p>
      )}

      <Verified
        verification={verificationWith(entry, addons, packageManager)}
      />

      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <li
            className="grid grid-cols-[20px_1fr] items-baseline gap-2.5 text-xs"
            key={step.run}
          >
            <span className="bg-foreground/5 text-muted-foreground text-fine grid size-5 place-items-center rounded-full font-medium tabular-nums">
              {index + 1}
            </span>
            <span className="flex flex-col gap-0.5">
              <code className="text-foreground font-mono">{step.run}</code>
              {"note" in step && step.note !== undefined && (
                <span className="text-muted-foreground">
                  {noteText(step.note)}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
};
