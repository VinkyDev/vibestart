import { mapValues } from "es-toolkit/object";
import { Check, FileCode2, Play, RotateCcw, Wrench, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, use, useState } from "react";
import type { ThemedToken } from "shiki/core";

import type { GeneratedFile } from "@vibestart/core";
import { Button } from "@vibestart/ui/components/button";
import { cn } from "@vibestart/ui/lib/utils";

import { tokensOf } from "#/lib/highlight.ts";
import { ease } from "#/lib/motion.ts";
import { m } from "#/paraglide/messages.js";

interface CodeLine {
  readonly kind?: "added" | "removed";
  readonly flagged?: true;
  readonly text: string;
}

interface Example {
  readonly captions: readonly [() => string, () => string, () => string];
  readonly command: string;
  readonly failure: string;
  readonly lines: readonly CodeLine[];
  readonly path: string;
  readonly success: string;
}

const scenarios = {
  types: {
    captions: [m.change_types_draft, m.change_types_check, m.change_types_fix],
    command: "vp check",
    failure:
      "TS2339: Property 'title' does not exist on type '{ id: number; name: string; … }'.",
    lines: [
      {
        text: "const { data: todos } = useSuspenseQuery(api.todos.list.queryOptions());",
      },
      { kind: "removed", text: "todos.map((todo) => todo.title);" },
      { kind: "added", text: "todos.map((todo) => todo.name);" },
    ],
    path: "apps/web/src/routes/_authenticated/todos.tsx",
    success: "No type errors",
  },
  quality: {
    captions: [
      m.change_quality_draft,
      m.change_quality_check,
      m.change_quality_fix,
    ],
    command: "vp check",
    failure:
      "typescript/no-floating-promises\nPromises must be awaited or have a rejection handler.",
    lines: [
      { text: "onSuccess: async () => {" },
      {
        kind: "removed",
        text: "  queryClient.invalidateQueries({ queryKey: api.todos.key() });",
      },
      {
        kind: "added",
        text: "  await queryClient.invalidateQueries({ queryKey: api.todos.key() });",
      },
      { text: "}," },
    ],
    path: "apps/web/src/routes/_authenticated/todos.tsx",
    success: "No lint errors",
  },
  tests: {
    captions: [m.change_tests_draft, m.change_tests_check, m.change_tests_fix],
    command: "vp test packages/api/tests/integration/todos.test.ts",
    failure:
      "FAIL keeps each user's todos private\nExpected: []\nReceived: [{ title: \"Alice's todo\", … }]",
    lines: [
      { flagged: true, text: "context.db.query.todos.findMany({" },
      { text: '  orderBy: { id: "asc" },' },
      {
        kind: "added",
        text: "  where: { userId: context.session.user.id },",
      },
      { text: "});" },
    ],
    path: "packages/api/src/routers/todos.ts",
    success: "PASS keeps each user's todos private",
  },
} satisfies Record<string, Example>;

export type Scenario = keyof typeof scenarios;

const files: Record<Scenario, GeneratedFile> = mapValues(
  scenarios,
  (example: Example) => ({
    content: example.lines.map(({ text }) => text).join("\n"),
    owner: "core",
    path: example.path,
  })
);

type Stage = 0 | 1 | 2;

const next = { 0: 1, 1: 2, 2: 0 } as const satisfies Record<Stage, Stage>;

const stages = [
  m.change_stage_draft,
  m.change_stage_check,
  m.change_stage_fix,
] as const;

const marker = { added: "+", removed: "−" } as const;

/** Italic is the least bit of Shiki's FontStyle, so every italic combination is a positive odd number. */
const italic = (style: number | undefined) =>
  style !== undefined && style > 0 && style % 2 === 1;

const Progress = ({ stage }: { readonly stage: Stage }) => (
  <ol className="flex items-center gap-2 text-xs">
    {stages.map((label, index) => {
      const failing = index === 1 && stage === 1;
      return (
        <li className="flex items-center gap-2" key={index}>
          {index > 0 && (
            <span className="bg-border relative h-px w-5 overflow-hidden sm:w-8">
              <span
                className={cn(
                  "bg-foreground/60 absolute inset-0 origin-left transition-transform duration-500",
                  index <= stage ? "scale-x-100" : "scale-x-0"
                )}
              />
            </span>
          )}
          <span
            className={cn(
              "text-micro grid size-5 place-items-center rounded-full font-medium tabular-nums transition-colors duration-300",
              index < stage && "bg-foreground text-background",
              index === stage &&
                (failing
                  ? "bg-removed text-white"
                  : "ring-foreground text-foreground ring-1"),
              index > stage && "ring-border text-muted-foreground ring-1"
            )}
          >
            {index < stage ? (
              <Check className="size-3" strokeWidth={2.5} />
            ) : (
              index + 1
            )}
          </span>
          <span
            className={cn(
              "transition-colors duration-300",
              index <= stage ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {label()}
          </span>
        </li>
      );
    })}
  </ol>
);

const Output = ({
  passed,
  text,
}: {
  readonly passed: boolean;
  readonly text: string;
}) => (
  <motion.span
    animate={{ height: "auto", opacity: 1 }}
    className="col-start-2 block overflow-hidden"
    exit={{ height: 0, opacity: 0 }}
    initial={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.4, ease }}
  >
    <span
      className={cn(
        "my-1.5 mr-4 flex gap-2 rounded-lg px-3 py-2 text-xs leading-5 whitespace-pre-wrap sm:mr-6",
        passed ? "bg-added/8 text-added" : "bg-removed/8 text-removed"
      )}
    >
      {passed ? (
        <Check className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
      ) : (
        <X className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
      )}
      <span className="min-w-0 [overflow-wrap:anywhere]">{text}</span>
    </span>
  </motion.span>
);

const Code = ({
  example,
  stage,
  tokens,
}: {
  readonly example: Example;
  readonly stage: Stage;
  readonly tokens?: readonly (readonly ThemedToken[])[];
}) => {
  const failed = stage === 1;
  const fixed = stage === 2;
  const rows = example.lines
    .map((line, index) => ({ ...line, index }))
    .filter(({ kind }) => fixed || kind !== "added");
  const pointed = rows.findIndex(
    ({ flagged, kind }) => flagged === true || kind === "removed"
  );
  const fixedAt = rows.findLastIndex(({ kind }) => kind === "added");
  const at = failed ? pointed : fixedAt;
  // The fix writes lines the change did not have, so the file reserves their rows from the start.
  const pending = fixed
    ? 0
    : example.lines.filter(({ kind }) => kind === "added").length;

  return (
    <pre className="sm:text-snippet grid grid-cols-[2.5rem_minmax(0,1fr)] py-4 font-mono text-xs leading-6 sm:grid-cols-[2.75rem_minmax(0,1fr)]">
      {rows.map(({ flagged, index, kind, text }, row) => {
        const wrong = failed && (flagged === true || kind === "removed");
        return [
          <span
            aria-hidden
            className={cn(
              "pr-3 text-right tabular-nums transition-colors duration-500 select-none",
              kind === "added" && "bg-added/10 text-added",
              kind === "removed" && fixed && "bg-removed/8 text-removed",
              wrong ? "text-removed" : "text-muted-foreground/45"
            )}
            key={`${text}-gutter`}
          >
            {fixed && kind !== undefined ? marker[kind] : row + 1}
          </span>,
          <code
            className={cn(
              "block pr-4 pl-4 -indent-4 [overflow-wrap:anywhere] whitespace-pre-wrap transition-colors duration-500 sm:pr-6",
              kind === "added" && "bg-added/10",
              kind === "removed" && fixed && "bg-removed/8 opacity-60",
              wrong &&
                "decoration-removed/70 underline decoration-wavy decoration-1 underline-offset-4"
            )}
            key={text}
          >
            {tokens?.[index]?.map((token, part) => (
              <span
                className={italic(token.fontStyle) ? "italic" : undefined}
                // A line's tokens repeat, so only their places tell them apart.
                // oxlint-disable-next-line react/no-array-index-key
                key={part}
                style={{ color: token.color }}
              >
                {token.content}
              </span>
            )) ?? text}
          </code>,
          row === at && (
            <AnimatePresence initial={false} key={`${text}-output`}>
              <Output
                key={stage}
                passed={fixed}
                text={fixed ? example.success : example.failure}
              />
            </AnimatePresence>
          ),
        ];
      })}
      {Array.from({ length: pending }, (_, row) => (
        <span aria-hidden className="col-span-2 block min-h-6" key={row} />
      ))}
    </pre>
  );
};

const Highlighted = ({
  example,
  file,
  stage,
}: {
  readonly example: Example;
  readonly file: GeneratedFile;
  readonly stage: Stage;
}) => <Code example={example} stage={stage} tokens={use(tokensOf(file))} />;

export const ChangeDemo = ({ scenario }: { readonly scenario: Scenario }) => {
  const [stage, setStage] = useState<Stage>(0);
  const example: Example = scenarios[scenario];
  const file = files[scenario];
  const fixed = stage === 2;
  const failed = stage === 1;
  const directories = example.path.split("/");
  const name = directories.pop();

  let Icon = Play;
  let label = m.change_demo_run();
  if (failed) {
    Icon = Wrench;
    label = m.change_demo_apply();
  } else if (fixed) {
    Icon = RotateCcw;
    label = m.change_demo_reset();
  }

  let verdict = (
    <span className="text-muted-foreground">{m.change_demo_pending()}</span>
  );
  if (failed) {
    verdict = (
      <span className="text-removed flex items-center gap-1.5 font-medium">
        <X className="size-3.5" strokeWidth={2} />
        {m.change_demo_failed()}
      </span>
    );
  } else if (fixed) {
    verdict = (
      <span className="text-added flex items-center gap-1.5 font-medium">
        <Check className="size-3.5" strokeWidth={2} />
        {m.change_demo_passed()}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-card shadow-sheet rounded-sheet flex min-w-0 flex-col overflow-hidden">
        <div className="flex flex-col gap-4 px-5 pt-5 pb-5 sm:px-6 sm:pt-6">
          <Progress stage={stage} />
          <div className="grid min-h-12">
            <AnimatePresence initial={false}>
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="text-ui col-start-1 row-start-1 leading-relaxed text-pretty"
                exit={{ opacity: 0, y: -4 }}
                initial={{ opacity: 0, y: 4 }}
                key={stage}
                transition={{ duration: 0.35, ease }}
              >
                {example.captions[stage]()}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <figure className="border-border border-y">
          <figcaption className="text-fine bg-foreground/[0.025] border-border flex h-9 items-center gap-2 border-b px-5 font-mono sm:px-6">
            <FileCode2
              className="text-muted-foreground size-3.5 shrink-0"
              strokeWidth={1.75}
            />
            <span className="text-foreground shrink-0">{name}</span>
            <span className="text-muted-foreground/70 truncate">
              {directories.join("/")}
            </span>
          </figcaption>
          <Suspense fallback={<Code example={example} stage={stage} />}>
            <Highlighted example={example} file={file} stage={stage} />
          </Suspense>
        </figure>

        <div className="flex items-center gap-3 px-5 py-3 text-xs sm:px-6">
          <code className="text-muted-foreground hidden min-w-0 truncate font-mono sm:block">
            $ {example.command}
          </code>
          <span
            aria-live="polite"
            className="sm:border-border sm:border-l sm:pl-3"
          >
            {verdict}
          </span>
          <Button
            className="ml-auto shrink-0"
            onClick={() => {
              setStage(next[stage]);
            }}
            size="sm"
            variant={fixed ? "secondary" : "default"}
          >
            <Icon />
            {label}
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground px-1 text-xs">
        {m.change_demo_label()} · {m.change_demo_note()}
      </p>
    </div>
  );
};
