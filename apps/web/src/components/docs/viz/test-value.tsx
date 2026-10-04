import { Bug, Check, LoaderCircle, RotateCcw, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@vibestart/ui/components/button";
import { cn } from "@vibestart/ui/lib/utils";

import { Demo, Verdict } from "#/components/demo/frame.tsx";
import { useTimeout } from "#/lib/use-timeout.ts";
import { m } from "#/paraglide/messages.js";

const typical = {
  shown: [
    "TodoList renders without crashing",
    "TodoList matches snapshot",
    "useTodos calls useQuery with ['todos']",
    "createTodo calls db.insert once",
    "listTodos calls findMany once",
    "listTodos returns the mocked rows",
    "AddTodoButton has className 'btn'",
    "formatTitle trims whitespace",
  ],
  total: 36,
};

const ours = [
  { name: "rejects an anonymous list with UNAUTHORIZED" },
  {
    leaks: true,
    name: "creates a todo with a trimmed title, not yet completed",
  },
  { name: 'rejects the title "" with BAD_REQUEST' },
  { leaks: true, name: "keeps each user's todos private" },
  { name: "visitors are sent to sign in before seeing todos" },
  { name: "a new user signs up and manages todos that persist across reloads" },
  { name: "a wrong password is rejected" },
];

const failing = ours.filter((test) => test.leaks === true).length;

const runFor = 1400;

const Row = ({
  failed,
  name,
  running,
}: {
  readonly failed: boolean;
  readonly name: string;
  readonly running: boolean;
}) => (
  <li className="text-fine flex items-center gap-2 py-1 font-mono leading-4">
    {running && (
      <LoaderCircle className="text-muted-foreground size-3.5 shrink-0 animate-spin" />
    )}
    {!running && failed && (
      <X className="text-removed size-3.5 shrink-0" strokeWidth={2.5} />
    )}
    {!running && !failed && (
      <Check className="text-added size-3.5 shrink-0" strokeWidth={2.5} />
    )}
    <span className={cn("truncate", failed && !running && "text-removed")}>
      {name}
    </span>
  </li>
);

const Suite = ({
  children,
  count,
  title,
}: {
  readonly children: ReactNode;
  readonly count: number;
  readonly title: string;
}) => (
  <section className="border-border bg-background/50 flex min-w-0 flex-col gap-2 rounded-xl border p-3">
    <h4 className="flex items-baseline justify-between gap-2 text-xs">
      <span className="font-medium">{title}</span>
      <span className="text-muted-foreground tabular-nums">
        {m.viz_test_count({ count })}
      </span>
    </h4>
    <ul>{children}</ul>
  </section>
);

export const TestValue = () => {
  const [broken, setBroken] = useState(false);
  const [running, setRunning] = useState(false);

  useTimeout(
    () => {
      setRunning(false);
    },
    running ? runFor : undefined
  );

  const rerun = (next: boolean) => {
    setBroken(next);
    setRunning(true);
  };

  return (
    <div className="my-8">
      <Demo
        actions={
          broken ? (
            <Button
              onClick={() => {
                rerun(false);
              }}
              size="sm"
              variant="ghost"
            >
              <RotateCcw />
              {m.viz_restore()}
            </Button>
          ) : (
            <Button
              onClick={() => {
                rerun(true);
              }}
              size="sm"
              variant="secondary"
            >
              <Bug />
              {m.viz_plant_bug()}
            </Button>
          )
        }
        caption={broken ? m.viz_tests_caption_broken() : m.viz_tests_caption()}
        status={
          running ? (
            <p className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
              <LoaderCircle
                className="size-4 animate-spin"
                strokeWidth={1.75}
              />
              vp test
            </p>
          ) : (
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
              <Verdict passed={!broken}>
                {broken ? m.viz_tests_shipped() : m.viz_tests_green()}
              </Verdict>
              {broken && (
                <Verdict passed>
                  {m.viz_tests_caught({ count: failing })}
                </Verdict>
              )}
            </div>
          )
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Suite count={typical.total} title={m.viz_tests_typical()}>
            {typical.shown.map((name) => (
              <Row failed={false} key={name} name={name} running={running} />
            ))}
            <li className="text-muted-foreground text-fine pt-1 pl-5.5">
              {m.viz_tests_more({
                count: typical.total - typical.shown.length,
              })}
            </li>
          </Suite>
          <Suite count={ours.length} title={m.viz_tests_ours()}>
            {ours.map((test) => (
              <Row
                failed={broken && test.leaks === true}
                key={test.name}
                name={test.name}
                running={running}
              />
            ))}
          </Suite>
        </div>
      </Demo>
    </div>
  );
};
