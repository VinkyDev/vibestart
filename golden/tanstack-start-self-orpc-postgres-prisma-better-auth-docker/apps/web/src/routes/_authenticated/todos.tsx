import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import type { SubmitEvent } from "react";

import { Button } from "@my-app/ui/components/button";
import { Card, CardContent } from "@my-app/ui/components/card";
import { Checkbox } from "@my-app/ui/components/checkbox";
import { Input } from "@my-app/ui/components/input";

import { api } from "#src/lib/api.ts";

const TodosPage = () => {
  const [title, setTitle] = useState("");
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
          setTitle("");
        },
      }
    );
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
                setTitle(event.target.value);
              }}
              placeholder="What needs to be done?"
              value={title}
            />
            <Button
              disabled={createTodo.isPending || title.trim() === ""}
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
              <li
                className="hover:bg-muted/40 flex items-center gap-3 px-4 py-2.5 transition-colors"
                key={todo.id}
              >
                <Checkbox
                  aria-label={todo.title}
                  checked={todo.completed}
                  onCheckedChange={(completed) => {
                    updateTodo.mutate({ id: todo.id, completed });
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
                  onClick={() => {
                    deleteTodo.mutate({ id: todo.id });
                  }}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Trash2Icon className="text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
};

export const Route = createFileRoute("/_authenticated/todos")({
  loader: async ({ context }) =>
    await context.queryClient.query(api.todos.list.queryOptions()),
  component: TodosPage,
});
