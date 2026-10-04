import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import { CodeFile, Demo, Line, Quiet } from "#/components/demo/frame.tsx";
import { Stepper } from "#/components/demo/stepper.tsx";
import { ease } from "#/lib/motion.ts";
import { m } from "#/paraglide/messages.js";

interface Stage {
  readonly text: string;
}

const commands = [
  undefined,
  undefined,
  "vp run db:generate",
  "vp run db:migrate",
];

const rows = [
  { completed: "true", id: "1", title: "Buy milk" },
  { completed: "false", id: "2", title: "Ship v1" },
];

const Schema = ({ edited }: { readonly edited: boolean }) => (
  <CodeFile className="tint-database" path="packages/db/src/schema/todos.ts">
    <Line>
      <Quiet>{'export const todos = pgTable("todos", {'}</Quiet>
    </Line>
    <Line>{"  id: integer().primaryKey(),"}</Line>
    <Line>{"  title: text().notNull(),"}</Line>
    <Line>{"  completed: boolean().default(false),"}</Line>
    <Line
      className={cn(
        "transition-colors duration-300",
        edited ? "bg-added/10 text-added" : "hidden"
      )}
    >
      {"  dueDate: date(),"}
    </Line>
    <Line>
      <Quiet>{"});"}</Quiet>
    </Line>
  </CodeFile>
);

const Migration = () => (
  <CodeFile
    className="tint-database"
    path="packages/db/src/migrations/…_due_date/migration.sql"
  >
    <Line>
      <Quiet>ALTER TABLE</Quiet>
      {' "todos"'}
    </Line>
    <Line className="text-added">{'  ADD COLUMN "due_date" date;'}</Line>
  </CodeFile>
);

const Table = ({ migrated }: { readonly migrated: boolean }) => {
  const columns = [
    "id",
    "title",
    "completed",
    ...(migrated ? ["due_date"] : []),
  ];
  return (
    <figure className="border-border bg-background/50 min-w-0 overflow-hidden rounded-xl border">
      <figcaption className="text-fine text-muted-foreground border-border flex h-8 items-center gap-2 border-b px-3 font-mono">
        <span className="tint-database bg-tint size-2 rounded-full" />
        todos
      </figcaption>
      <div className="overflow-x-auto">
        <table className="text-fine w-full font-mono">
          <thead>
            <tr className="text-muted-foreground">
              {columns.map((column) => (
                <th
                  className={cn(
                    "border-border border-b px-3 py-1.5 text-left font-normal",
                    column === "due_date" && "text-added"
                  )}
                  key={column}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((todo) => (
              <tr key={todo.id}>
                <td className="px-3 py-1.5">{todo.id}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">{todo.title}</td>
                <td className="px-3 py-1.5">{todo.completed}</td>
                <AnimatePresence initial={false}>
                  {migrated && (
                    <motion.td
                      animate={{ opacity: 1 }}
                      className="text-muted-foreground bg-added/[0.06] px-3 py-1.5"
                      exit={{ opacity: 0 }}
                      initial={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease }}
                    >
                      NULL
                    </motion.td>
                  )}
                </AnimatePresence>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
};

export const SchemaMigration = ({
  steps,
}: {
  readonly steps: readonly [Stage, Stage, Stage, Stage];
}) => {
  const [index, setIndex] = useState(0);
  const step = steps[index] ?? steps[0];

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
              {commands[index]}
            </code>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {m.viz_step({ current: index + 1, total: steps.length })}
            </span>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-[1.25fr_1fr]">
          {index === 2 ? <Migration /> : <Schema edited={index >= 1} />}
          <Table migrated={index === 3} />
        </div>
      </Demo>
    </div>
  );
};
