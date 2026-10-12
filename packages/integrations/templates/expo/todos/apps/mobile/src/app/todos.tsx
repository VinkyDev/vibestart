import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Circle, CircleCheck } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";

import { Button } from "#src/components/ui/button.tsx";
import { Input } from "#src/components/ui/input.tsx";
import { Text } from "#src/components/ui/text.tsx";
import { api } from "#src/lib/api.ts";

const Todos = () => {
  const [title, setTitle] = useState("");
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

  return (
    <View className="bg-background flex-1 gap-3 p-4">
      <View className="flex-row gap-2">
        <Input
          accessibilityLabel="New todo"
          className="flex-1"
          onChangeText={setTitle}
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
                  setTitle("");
                },
              }
            );
          }}
        />
      </View>
      <FlatList
        contentContainerClassName="gap-2"
        data={todos.data ?? []}
        keyExtractor={(todo) => String(todo.id)}
        ListEmptyComponent={
          <Text className="text-muted-foreground py-4 text-center">
            {todos.isPending ? "Loading…" : "No todos yet."}
          </Text>
        }
        renderItem={({ item }) => (
          <View className="border-border flex-row items-center gap-2 rounded-md border p-3">
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.completed }}
              className="flex-1 flex-row items-center gap-2"
              onPress={() => {
                updateTodo.mutate({ completed: !item.completed, id: item.id });
              }}
            >
              {item.completed ? (
                <CircleCheck className="text-primary" size={20} />
              ) : (
                <Circle className="text-muted-foreground" size={20} />
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
            <Button
              accessibilityLabel={`Delete ${item.title}`}
              label="Delete"
              onPress={() => {
                deleteTodo.mutate({ id: item.id });
              }}
              variant="outline"
            />
          </View>
        )}
      />
    </View>
  );
};

export default Todos;
