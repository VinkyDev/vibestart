import { RegistryProvider, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Exit, Schema } from "effect";
import { AsyncResult } from "effect/reactivity";
import { Circle, CircleCheck, Trash2 } from "lucide-react-native";
import { useState, useTransition } from "react";
import { FlatList, Pressable, View } from "react-native";

import type { Todo } from "@my-app/contracts";
import { TodoTitle } from "@my-app/contracts";

import { Button } from "#src/components/ui/button.tsx";
import { Input } from "#src/components/ui/input.tsx";
import { Text } from "#src/components/ui/text.tsx";
import {
  createTodoAtom,
  deleteTodoAtom,
  todosAtom,
  todosKeys,
  updateTodoAtom,
} from "#src/lib/api.ts";
import { authClient } from "#src/lib/auth-client.ts";
import { alertFailure } from "#src/lib/notify.ts";

const decodeTitle = Schema.decodeUnknownExit(TodoTitle);

const Separator = () => <View className="border-border ml-12 border-t" />;

const emptyTitle = (
  result: AsyncResult.AsyncResult<readonly Todo[], unknown>
) => {
  if (AsyncResult.isFailure(result)) {
    return "Could not load the todos.";
  }

  return AsyncResult.isInitial(result) ? "Loading…" : "No todos yet.";
};

const TodoRow = ({ todo }: { todo: Todo }) => {
  const [pending, startMutation] = useTransition();

  const updateTodo = useAtomSet(updateTodoAtom(todo.id), {
    mode: "promiseExit",
  });

  const deleteTodo = useAtomSet(deleteTodoAtom(todo.id), {
    mode: "promiseExit",
  });

  return (
    <View className="flex-row items-center gap-1 pr-2">
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: todo.completed }}
        className="flex-1 flex-row items-center gap-3 py-3.5 pl-4 active:opacity-60"
        disabled={pending}
        onPress={() => {
          startMutation(async () => {
            alertFailure(await updateTodo(!todo.completed));
          });
        }}
      >
        {todo.completed ? (
          <CircleCheck className="text-primary" size={22} />
        ) : (
          <Circle className="text-muted-foreground" size={22} />
        )}
        <Text
          className={
            todo.completed
              ? "text-muted-foreground flex-1 line-through"
              : "flex-1"
          }
        >
          {todo.title}
        </Text>
      </Pressable>
      <Pressable
        accessibilityLabel={`Delete ${todo.title}`}
        accessibilityRole="button"
        className="size-10 items-center justify-center rounded-full active:opacity-60"
        disabled={pending}
        hitSlop={4}
        onPress={() => {
          startMutation(async () => {
            alertFailure(await deleteTodo());
          });
        }}
      >
        <Trash2 className="text-muted-foreground" size={18} />
      </Pressable>
    </View>
  );
};

const Todos = () => {
  const [draft, setDraft] = useState({ title: "" });
  const { title } = draft;
  const [isCreating, startCreating] = useTransition();
  const todosResult = useAtomValue(todosAtom);
  const createTodo = useAtomSet(createTodoAtom, { mode: "promiseExit" });
  const validTitle = decodeTitle(title);

  const todos = AsyncResult.isSuccess(todosResult) ? todosResult.value : [];
  const done = todos.filter((todo) => todo.completed).length;

  return (
    <View className="bg-background flex-1 gap-4 px-5 pt-5">
      <View className="flex-row items-center gap-2">
        <Input
          accessibilityLabel="New todo"
          className="flex-1"
          onChangeText={(value) => {
            setDraft({ title: value });
          }}
          placeholder="What needs to be done?"
          value={title}
        />
        <Button
          disabled={isCreating || Exit.isFailure(validTitle)}
          label="Add"
          onPress={() => {
            if (Exit.isFailure(validTitle)) {
              return;
            }

            startCreating(async () => {
              const exit = await createTodo({
                payload: { title: validTitle.value },
                reactivityKeys: todosKeys,
              });

              if (Exit.isSuccess(exit)) {
                setDraft((current) =>
                  current === draft ? { title: "" } : current
                );
              }

              alertFailure(exit);
            });
          }}
        />
      </View>
      {todos.length > 0 && (
        <Text className="text-muted-foreground text-sm">
          {done} of {todos.length} done
        </Text>
      )}
      <FlatList
        contentContainerClassName="border-border bg-card mb-8 overflow-hidden rounded-2xl border"
        data={todos}
        ItemSeparatorComponent={Separator}
        keyExtractor={(todo) => String(todo.id)}
        ListEmptyComponent={
          <View className="items-center gap-1 px-4 py-10">
            <Text
              className={
                AsyncResult.isFailure(todosResult)
                  ? "text-destructive font-medium"
                  : "font-medium"
              }
            >
              {emptyTitle(todosResult)}
            </Text>
            {AsyncResult.isSuccess(todosResult) && (
              <Text className="text-muted-foreground text-center text-sm">
                Each one you add is saved through the API.
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => <TodoRow todo={item} />}
      />
    </View>
  );
};

const TodosScreen = () => {
  const { data: session } = authClient.useSession();

  if (session === null) {
    return null;
  }

  return (
    <RegistryProvider key={session.session.id}>
      <Todos />
    </RegistryProvider>
  );
};

export default TodosScreen;
