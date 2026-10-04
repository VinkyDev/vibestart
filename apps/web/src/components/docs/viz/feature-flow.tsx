import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import { CodeFile, Demo, Line, Quiet } from "#/components/demo/frame.tsx";
import { Stepper } from "#/components/demo/stepper.tsx";
import { ease } from "#/lib/motion.ts";
import { m } from "#/paraglide/messages.js";

interface Step {
  readonly text: string;
}

const Added = ({ children }: { readonly children: ReactNode }) => (
  <Line className="bg-added/10 text-added">{children}</Line>
);

const files = [
  {
    code: (
      <>
        <Line>
          <Quiet>{'export const todos = snakeCase.table("todos", {'}</Quiet>
        </Line>
        <Line>{"  title: text().notNull(),"}</Line>
        <Added>{'  dueAt: integer({ mode: "timestamp_ms" }),'}</Added>
        <Line>
          <Quiet>{"  userId: text().notNull() …"}</Quiet>
        </Line>
      </>
    ),
    path: "packages/db/src/schema/todos.ts",
    tint: "tint-database",
  },
  {
    code: (
      <>
        <Line>
          <Quiet>-- generated, reviewed, committed</Quiet>
        </Line>
        <Added>ALTER TABLE `todos` ADD `due_at` integer;</Added>
      </>
    ),
    command: "vp run db:generate",
    path: "packages/db/src/migrations/…_due_at/migration.sql",
    tint: "tint-database",
  },
  {
    code: (
      <>
        <Line>
          <Quiet>create: protectedProcedure</Quiet>
        </Line>
        <Line>{"  .input(z.object({"}</Line>
        <Line>{"    title: z.string().trim().min(1).max(200),"}</Line>
        <Added>{"    dueAt: z.date().optional(),"}</Added>
        <Line>{"  }))"}</Line>
      </>
    ),
    path: "packages/api/src/routers/todos.ts",
    tint: "tint-api",
  },
  {
    code: (
      <>
        <Line>
          <Quiet>{"<Input value={title} … />"}</Quiet>
        </Line>
        <Added>{'<Input type="date" value={dueAt} … />'}</Added>
        <Line>
          <Quiet>{"createTodo.mutate({ title, dueAt })"}</Quiet>
        </Line>
      </>
    ),
    path: "apps/web/src/routes/_authenticated/todos.tsx",
    tint: "tint-framework",
  },
  {
    code: (
      <>
        <Added>{'it("keeps a todo\'s due date", async () => {'}</Added>
        <Added>{"  const client = await signUp();"}</Added>
        <Added>
          {"  const todo = await client.todos.create({ title, dueAt });"}
        </Added>
        <Added>{"  expect(todo.dueAt).toStrictEqual(dueAt);"}</Added>
        <Added>{"});"}</Added>
      </>
    ),
    command: "vp run ready",
    path: "packages/api/tests/integration/todos.test.ts",
    tint: "tint-foundation",
  },
] as const;

const PathName = ({ path }: { readonly path: string }) => {
  const cut = path.lastIndexOf("/") + 1;
  return (
    <span className="min-w-0 truncate">
      <span className="text-muted-foreground">{path.slice(0, cut)}</span>
      {path.slice(cut)}
    </span>
  );
};

export const FeatureFlow = ({
  steps,
}: {
  readonly steps: readonly [Step, Step, Step, Step, Step];
}) => {
  const [index, setIndex] = useState(0);
  const step = steps[index] ?? steps[0];
  const file = files[index] ?? files[0];

  return (
    <div className="my-8">
      <Demo
        actions={
          <Stepper count={steps.length} current={index} onChange={setIndex} />
        }
        caption={step.text}
        status={
          <div className="flex min-h-6 items-center justify-between gap-4">
            <code className="text-foreground/80 min-w-0 truncate font-mono text-xs">
              {"command" in file ? `$ ${file.command}` : ""}
            </code>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {m.viz_step({ current: index + 1, total: steps.length })}
            </span>
          </div>
        }
      >
        {/* The size sits on the list: merged with a colour, it would be read as one and dropped. */}
        <ol className="text-fine flex flex-col gap-0.5">
          {files.map((candidate, order) => (
            <li key={candidate.path}>
              <button
                className={cn(
                  candidate.tint,
                  "flex h-7 w-full items-center gap-2.5 rounded-md px-2 text-left font-mono transition-colors",
                  order === index
                    ? "bg-tint-soft text-foreground"
                    : "hover:bg-foreground/[0.035]",
                  order > index && "opacity-45"
                )}
                onClick={() => {
                  setIndex(order);
                }}
                type="button"
              >
                <span className="grid size-3.5 shrink-0 place-items-center">
                  {order < index ? (
                    <Check className="text-added size-3.5" strokeWidth={2.5} />
                  ) : (
                    <span className="bg-tint size-1.5 rounded-full" />
                  )}
                </span>
                <PathName path={candidate.path} />
              </button>
            </li>
          ))}
        </ol>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: 4 }}
            key={index}
            transition={{ duration: 0.25, ease }}
          >
            <CodeFile className={file.tint} path={file.path}>
              {file.code}
            </CodeFile>
          </motion.div>
        </AnimatePresence>
      </Demo>
    </div>
  );
};
