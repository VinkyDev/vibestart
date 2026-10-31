import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Circle, CircleCheck, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";

import { Button } from "#src/components/ui/button.tsx";
import { Input } from "#src/components/ui/input.tsx";
import { Text } from "#src/components/ui/text.tsx";
import { api } from "#src/lib/api.ts";

const Separator = () => <View className="border-border ml-12 border-t" />;

const emptyTitle = ({
  isError,
  isPending,
}: {
  isError: boolean;
  isPending: boolean;
}) => {
  if (isError) {
    return "Could not load the todos.";
  }

  return isPending ? "Loading…" : "No todos yet.";
};

const Todos = () => {
  const [draft, setDraft] = useState({ title: "" });
  const { title } = draft;
  const queryClient = useQueryClient();
  const todos = useQuery(api.todos.list.queryOptions());

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

  const done = (todos.data ?? []).filter((todo) => todo.completed).length;

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
          disabled={createTodo.isPending || title.trim() === ""}
          label="Add"
          onPress={() => {
            createTodo.mutate(
              { title },
              {
                onSuccess: () => {
                  setDraft((current) =>
                    current === draft ? { title: "" } : current
                  );
                },
              }
            );
          }}
        />
      </View>
      {todos.data !== undefined && todos.data.length > 0 && (
        <Text className="text-muted-foreground text-sm">
          {done} of {todos.data.length} done
        </Text>
      )}
      <FlatList
        contentContainerClassName="border-border bg-card mb-8 overflow-hidden rounded-2xl border"
        data={todos.data ?? []}
        ItemSeparatorComponent={Separator}
        keyExtractor={(todo) => todo.id}
        ListEmptyComponent={
          <View className="items-center gap-1 px-4 py-10">
            <Text
              className={
                todos.isError ? "text-destructive font-medium" : "font-medium"
              }
            >
              {emptyTitle(todos)}
            </Text>
            {todos.isSuccess && (
              <Text className="text-muted-foreground text-center text-sm">
                Each one you add is saved through the API.
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-1 pr-2">
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.completed }}
              className="flex-1 flex-row items-center gap-3 py-3.5 pl-4 active:opacity-60"
              onPress={() => {
                updateTodo.mutate({ completed: !item.completed, id: item.id });
              }}
            >
              {item.completed ? (
                <CircleCheck className="text-primary" size={22} />
              ) : (
                <Circle className="text-muted-foreground" size={22} />
              )}
              <Text
                className={
                  item.completed
                    ? "text-muted-foreground flex-1 line-through"
                    : "flex-1"
                }
              >
                {item.title}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Delete ${item.title}`}
              accessibilityRole="button"
              className="size-10 items-center justify-center rounded-full active:opacity-60"
              hitSlop={4}
              onPress={() => {
                deleteTodo.mutate({ id: item.id });
              }}
            >
              <Trash2 className="text-muted-foreground" size={18} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
};

export default Todos;
