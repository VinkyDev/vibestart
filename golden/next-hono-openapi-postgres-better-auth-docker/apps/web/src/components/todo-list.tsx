"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import type { SubmitEvent } from "react";

import { Button } from "@my-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-app/ui/components/card";
import { Checkbox } from "@my-app/ui/components/checkbox";
import { Input } from "@my-app/ui/components/input";

import { api } from "#src/lib/api.ts";

export const TodoList = () => {
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
    <Card>
      <CardHeader>
        <CardTitle>Todos</CardTitle>
        <CardDescription>Private to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
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
          {todos.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No todos yet.
            </p>
          ) : (
            <ul className="grid gap-1">
              {todos.map((todo) => (
                <li
                  className="hover:bg-muted/50 flex items-center gap-3 rounded-md px-2 py-1.5"
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
                    className={
                      todo.completed
                        ? "text-muted-foreground flex-1 text-sm line-through"
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
                    <Trash2Icon />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
