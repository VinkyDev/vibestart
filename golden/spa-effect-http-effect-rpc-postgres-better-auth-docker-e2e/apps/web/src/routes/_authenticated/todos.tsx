import {
  useAtomRefresh,
  useAtomSet,
  useAtomSuspense,
} from "@effect/atom-react";
import { createFileRoute } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Exit, Schema } from "effect";
import { Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import type { SubmitEvent } from "react";

import { TodoTitle } from "@my-app/contracts";
import type { Todo } from "@my-app/contracts";
import { Button } from "@my-app/ui/components/button";
import { Card, CardContent } from "@my-app/ui/components/card";
import { Checkbox } from "@my-app/ui/components/checkbox";
import { Input } from "@my-app/ui/components/input";

import {
  createTodoAtom,
  deleteTodoAtom,
  todosAtom,
  todosKeys,
  updateTodoAtom,
} from "#src/lib/api.ts";
import { toastFailure } from "#src/lib/notify.ts";

const decodeTitle = Schema.decodeUnknownExit(TodoTitle);

const TodoItem = ({ todo }: { todo: Todo }) => {
  const [pending, startMutation] = useTransition();

  const updateTodo = useAtomSet(updateTodoAtom(todo.id), {
    mode: "promiseExit",
  });

  const deleteTodo = useAtomSet(deleteTodoAtom(todo.id), {
    mode: "promiseExit",
  });

  return (
    <li className="hover:bg-muted/40 flex items-center gap-3 px-4 py-2.5 transition-colors">
      <Checkbox
        aria-label={todo.title}
        checked={todo.completed}
        disabled={pending}
        onCheckedChange={(completed) => {
          startMutation(async () => {
            toastFailure(await updateTodo(completed));
          });
        }}
      />
      <span
        className={
          todo.completed
            ? "text-muted-foreground decoration-muted-foreground/50 flex-1 text-sm line-through"
            : "flex-1 text-sm"
        }
      >
        {todo.title}
      </span>
      <Button
        aria-label={`Delete ${todo.title}`}
        disabled={pending}
        onClick={() => {
          startMutation(async () => {
            toastFailure(await deleteTodo());
          });
        }}
        size="icon-sm"
        variant="ghost"
      >
        <Trash2Icon className="text-muted-foreground" />
      </Button>
    </li>
  );
};

const TodosPage = () => {
  const [draft, setDraft] = useState({ title: "" });
  const { title } = draft;
  const [isCreating, startCreating] = useTransition();
  const { value: todos } = useAtomSuspense(todosAtom);
  const createTodo = useAtomSet(createTodoAtom, { mode: "promiseExit" });
  const validTitle = decodeTitle(title);

  const done = todos.filter((todo) => todo.completed).length;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (Exit.isFailure(validTitle)) {
      return;
    }

    startCreating(async () => {
      const exit = await createTodo({
        payload: { title: validTitle.value },
        reactivityKeys: todosKeys,
      });

      if (Exit.isSuccess(exit)) {
        setDraft((current) => (current === draft ? { title: "" } : current));
      }

      toastFailure(exit);
    });
  };

  return (
    <section className="grid gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Todos</h1>
          <p className="text-muted-foreground text-sm">
            Private to your account.
          </p>
        </div>
        {todos.length > 0 && (
          <p className="text-muted-foreground text-sm tabular-nums">
            {done} of {todos.length} done
          </p>
        )}
      </div>
      <Card>
        <CardContent>
          <form className="flex gap-2" onSubmit={handleSubmit}>
            <Input
              aria-label="New todo"
              onChange={(event) => {
                setDraft({ title: event.target.value });
              }}
              placeholder="What needs to be done?"
              value={title}
            />
            <Button
              disabled={isCreating || Exit.isFailure(validTitle)}
              type="submit"
            >
              Add
            </Button>
          </form>
        </CardContent>
        {todos.length === 0 ? (
          <div className="grid gap-1 border-t px-4 pt-10 pb-6 text-center">
            <p className="text-sm font-medium">No todos yet.</p>
            <p className="text-muted-foreground text-sm">
              Each one you add is saved through the API.
            </p>
          </div>
        ) : (
          <ul className="-mb-4 divide-y border-t">
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
};

const TodosError = ({ reset }: ErrorComponentProps) => {
  const refresh = useAtomRefresh(todosAtom);

  return (
    <section className="grid justify-items-start gap-4" role="alert">
      <p>Could not load your todos.</p>
      <Button
        onClick={() => {
          refresh();
          reset();
        }}
      >
        Try again
      </Button>
    </section>
  );
};

export const Route = createFileRoute("/_authenticated/todos")({
  component: TodosPage,
  errorComponent: TodosError,
});
