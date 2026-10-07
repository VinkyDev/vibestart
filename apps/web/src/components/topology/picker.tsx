import { Check, CornerDownRight } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { Suspense, use } from "react";

import type { Stack } from "@vibestart/core";
import { cn } from "@vibestart/ui/lib/utils";

import type { Project, StackEntry } from "#/lib/project.ts";
import { fileDelta, loadProject } from "#/lib/projects.ts";
import { changeText, fitOf, noneName, roles, tintClass } from "#/lib/roles.ts";
import type { Decision, Outcome } from "#/lib/stack.ts";
import { optionsOf, outcome, recommended } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const Delta = ({
  addons,
  from,
  to,
}: {
  readonly addons: readonly string[];
  readonly from: Project;
  readonly to: StackEntry;
}) => {
  const { added, changed, removed } = fileDelta(
    from,
    use(loadProject(to, addons, from.packageManager ?? "pnpm"))
  );
  return (
    <span className="flex gap-1.5 text-xs font-medium tabular-nums">
      {added.size > 0 && <span className="text-added">+{added.size}</span>}
      {removed.length > 0 && (
        <span className="text-removed">−{removed.length}</span>
      )}
      {changed.size > 0 && (
        <span className="text-changed">~{changed.size}</span>
      )}
    </span>
  );
};

const Row = ({
  addons,
  current,
  currentRef,
  fit,
  name,
  onChoose,
  onPreview,
  option,
  project,
  suggested,
}: {
  readonly addons: readonly string[];
  readonly current: boolean;
  readonly currentRef: RefObject<HTMLButtonElement | null>;
  readonly fit: string;
  readonly name: string;
  readonly onChoose: (entry: StackEntry) => void;
  readonly onPreview: (entry: StackEntry | null) => void;
  readonly option: Outcome;
  readonly project: Project;
  readonly suggested: boolean;
}) => (
  <button
    className={cn(
      "hover:bg-foreground/[0.045] focus-visible:bg-foreground/[0.06] grid w-full grid-cols-[18px_1fr_auto] items-start gap-x-3 rounded-xl px-3 py-2.5 text-left transition-colors outline-none",
      current && "bg-tint-soft hover:bg-tint-soft focus-visible:bg-tint-soft"
    )}
    onClick={() => {
      onChoose(option.entry);
    }}
    onFocus={() => {
      onPreview(current ? null : option.entry);
    }}
    onPointerEnter={() => {
      onPreview(current ? null : option.entry);
    }}
    ref={current ? currentRef : undefined}
    type="button"
  >
    <span
      className={cn(
        "border-foreground/20 mt-0.5 grid size-[18px] place-items-center rounded-full border transition-colors",
        current && "bg-tint border-transparent text-white"
      )}
    >
      {current && <Check className="size-3" strokeWidth={3} />}
    </span>
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="flex items-center gap-2">
        <span className="text-foreground truncate text-sm font-medium">
          {name}
        </span>
        {suggested && (
          <span className="bg-tint-soft text-tint text-fine rounded-full px-2 py-px font-medium">
            {m.recommended()}
          </span>
        )}
      </span>
      <span className="text-muted-foreground text-xs leading-snug">{fit}</span>
      {option.changes.length > 0 && (
        <span className="text-changed mt-0.5 flex items-start gap-1 text-xs leading-snug">
          <CornerDownRight className="mt-px size-3 shrink-0" />
          {option.changes.map(changeText).join(", ")}
        </span>
      )}
    </span>
    <span className="pt-0.5">
      {current ? (
        <span className="text-tint text-xs font-medium">{m.current()}</span>
      ) : (
        <Suspense fallback={null}>
          <Delta addons={addons} from={project} to={option.entry} />
        </Suspense>
      )}
    </span>
  </button>
);

const unmarked: ReadonlySet<Decision> = new Set([
  "auth",
  "database",
  "desktop",
  "testing",
]);

const marksRecommended = (kind: Decision, id: string | null) =>
  !unmarked.has(kind) &&
  !(kind === "deployment" && id === null) &&
  id === (recommended[kind] ?? null);

export const Picker = ({
  addons,
  currentRef,
  details,
  kind,
  onChoose,
  onPreview,
  project,
  stack,
}: {
  readonly addons: readonly string[];
  readonly currentRef: RefObject<HTMLButtonElement | null>;
  readonly details?: ReactNode;
  readonly kind: Decision;
  readonly onChoose: (entry: StackEntry) => void;
  readonly onPreview: (entry: StackEntry | null) => void;
  readonly project: Project;
  readonly stack: Stack;
}) => {
  const { about, question } = roles[kind];
  const current = stack[kind] ?? null;
  return (
    <div
      className={cn(tintClass[kind], "flex flex-col gap-0.5")}
      onPointerLeave={() => {
        onPreview(null);
      }}
    >
      <div className="flex flex-col gap-0.5 px-3 pt-2.5 pb-2">
        <span className="font-headline text-foreground text-xl">
          {question}
        </span>
        <span className="text-muted-foreground text-xs">{about}</span>
      </div>
      {optionsOf(kind)
        .filter((integration) => kind !== "runtime" || integration !== null)
        .map((integration) => {
          const id = integration?.id ?? null;
          const option = outcome(stack, kind, id);
          return (
            option !== undefined && (
              <Row
                addons={addons}
                current={id === current}
                currentRef={currentRef}
                fit={fitOf(kind, id)}
                key={id ?? "none"}
                name={integration?.name ?? noneName(kind)}
                onChoose={onChoose}
                onPreview={onPreview}
                option={option}
                project={project}
                suggested={marksRecommended(kind, id)}
              />
            )
          );
        })}
      {details !== undefined && (
        <div className="border-border text-muted-foreground mx-3 mt-1 mb-2.5 flex flex-col gap-2 border-t pt-2.5 text-xs leading-relaxed">
          {details}
        </div>
      )}
    </div>
  );
};
