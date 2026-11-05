"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { cn } from "@my-app/ui/lib/utils";
import { ListTodoIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { SubmitEvent } from "react";

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

import { api } from "#src/lib/api.ts";

export const TodoList = () => {
  const [draft, setDraft] = useState({ title: "" });
  const { title } = draft;
  const queryClient = useQueryClient();
  const { data: todos } = useSuspenseQuery(api.todos.list.queryOptions());

  const invalidateTodos = {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: api.todos.key() });
    },
  };

  const createTodo = useMutation(
    api.todos.create.mutationOptions(invalidateTodos)
  );

  const updateTodo = useMutation(
    api.todos.update.mutationOptions(invalidateTodos)
  );

  const deleteTodo = useMutation(
    api.todos.delete.mutationOptions(invalidateTodos)
  );

  const done = todos.filter((todo) => todo.completed).length;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    createTodo.mutate(
      { title },
      {
        onSuccess: () => {
          // Keep whatever was typed while the request was in flight.
          setDraft((current) => (current === draft ? { title: "" } : current));
        },
      }
    );
  };

  return (
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
              disabled={createTodo.isPending || title.trim() === ""}
              type="submit"
            >
              {createTodo.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <PlusIcon data-icon="inline-start" />
              )}
              Add
            </Button>
          </form>
        </CardContent>
        <Separator />
        {todos.length === 0 ? (
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
        ) : (
          <ul className="-my-4 divide-y">
            <AnimatePresence initial={false}>
            {todos.map((todo) => (
              <motion.li
                animate={{ height: "auto", opacity: 1 }}
                className="hover:bg-muted/50 flex items-center gap-3 overflow-hidden px-4 py-3 transition-colors"
                exit={{ height: 0, opacity: 0, paddingBlock: 0 }}
                initial={{ height: 0, opacity: 0 }}
                layout="position"
                transition={{ duration: 0.2 }}
                key={todo.id}
              >
                <Checkbox
                  aria-label={todo.title}
                  checked={todo.completed}
                  onCheckedChange={(completed) => {
                    updateTodo.mutate({ completed, id: todo.id });
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
                  onClick={() => {
                    deleteTodo.mutate({ id: todo.id });
                  }}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Trash2Icon className="text-muted-foreground" />
                </Button>
              </motion.li>
            ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>
    </section>
  );
};
