import {
  useAtomRefresh,
  useAtomSet,
  useAtomSuspense,
} from "@effect/atom-react";
import { createFileRoute } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { cn } from "@my-app/ui/lib/utils";
import { Exit, Schema } from "effect";
import { ListTodoIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useState, useTransition } from "react";
import type { SubmitEvent } from "react";

import { TodoTitle } from "@my-app/contracts";
import type { Todo } from "@my-app/contracts";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@my-app/ui/components/alert";
import { Badge } from "@my-app/ui/components/badge";
import { Button } from "@my-app/ui/components/button";
import { Card, CardContent } from "@my-app/ui/components/card";
import { Checkbox } from "@my-app/ui/components/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@my-app/ui/components/empty";
import { Input } from "@my-app/ui/components/input";
import { Separator } from "@my-app/ui/components/separator";
import { Spinner } from "@my-app/ui/components/spinner";

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
  const reduced = useReducedMotion() === true;
  const [pending, startMutation] = useTransition();

  const updateTodo = useAtomSet(updateTodoAtom(todo.id), {
    mode: "promiseExit",
  });

  const deleteTodo = useAtomSet(deleteTodoAtom(todo.id), {
    mode: "promiseExit",
  });

  return (
    <motion.li
      animate={{ height: "auto", opacity: 1 }}
      className="hover:bg-muted/50 flex items-center gap-3 overflow-hidden px-4 py-3 transition-colors"
      exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0, paddingBlock: 0 }}
      initial={{ height: 0, opacity: 0 }}
      layout="position"
      transition={{ duration: 0.2 }}
    >
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
        className={cn(
          "flex-1 text-sm wrap-anywhere",
          todo.completed &&
            "text-muted-foreground decoration-muted-foreground/50 line-through"
        )}
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
    </motion.li>
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
    <MotionConfig reducedMotion="user">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-4xl font-semibold tracking-tight">Todos</h1>
            <p className="text-muted-foreground text-sm">
              Private to your account.
            </p>
          </div>
          {todos.length > 0 && (
            <Badge variant="secondary">
              {done} of {todos.length} done
            </Badge>
          )}
        </header>
        {todos.length > 0 && (
          <div className="bg-muted h-1 overflow-hidden rounded-full">
            <motion.div
              animate={{ scaleX: done / todos.length }}
              className="bg-primary h-full origin-left"
              initial={false}
              transition={{ bounce: 0, duration: 0.5, type: "spring" }}
            />
          </div>
        )}
        <Card>
          <CardContent>
            <form className="flex gap-2" onSubmit={handleSubmit}>
              <Input
                aria-label="New todo"
                maxLength={200}
                onChange={(event) => {
                  setDraft({ title: event.target.value });
                }}
                placeholder="Add a todo"
                value={title}
              />
              <Button
                disabled={isCreating || Exit.isFailure(validTitle)}
                type="submit"
              >
                {isCreating ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <PlusIcon data-icon="inline-start" />
                )}
                Add
              </Button>
            </form>
          </CardContent>
          <Separator />
          <ul className="-my-4 divide-y empty:hidden">
            <AnimatePresence initial={false}>
              {todos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </AnimatePresence>
          </ul>
          {todos.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ListTodoIcon />
                </EmptyMedia>
                <EmptyTitle>No todos yet.</EmptyTitle>
                <EmptyDescription>
                  Add one above. It is saved through the API to the database.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </Card>
      </section>
    </MotionConfig>
  );
};

const TodosError = ({ reset }: ErrorComponentProps) => {
  const refresh = useAtomRefresh(todosAtom);

  return (
    <Alert className="mx-auto max-w-2xl" variant="destructive">
      <AlertTitle>Could not load your todos.</AlertTitle>
      <AlertDescription>
        The API did not answer. Check that the server is running.
      </AlertDescription>
      <AlertAction>
        <Button
          onClick={() => {
            refresh();
            reset();
          }}
          size="sm"
          variant="outline"
        >
          Try again
        </Button>
      </AlertAction>
    </Alert>
  );
};

export const Route = createFileRoute("/_authenticated/todos")({
  component: TodosPage,
  errorComponent: TodosError,
});
