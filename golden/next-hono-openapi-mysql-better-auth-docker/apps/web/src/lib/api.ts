import { mutationOptions, queryOptions } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import { parseResponse } from "hono/client";

import { createClient } from "#src/lib/client.ts";

type Client = ReturnType<typeof createClient>;

const mutation = <Input, Output>(
  mutationFn: (input: Input) => Promise<Output>
) => ({
  mutationOptions: (
    options: Pick<UseMutationOptions<Output, Error, Input>, "onSuccess"> = {}
  ) => mutationOptions({ ...options, mutationFn }),
});

const todosKey = ["todos"] as const;

export const createQueries = (client: Client) => ({
  todos: {
    create: mutation(
      async (json: { title: string }) =>
        await parseResponse(client.todos.$post({ json }))
    ),
    delete: mutation(
      async ({ id }: { id: number }) =>
        await parseResponse(
          client.todos[":id"].$delete({ param: { id: String(id) } })
        )
    ),
    key: () => todosKey,
    list: {
      queryOptions: () =>
        queryOptions({
          queryFn: async () => await parseResponse(client.todos.$get()),
          queryKey: [...todosKey, "list"],
        }),
    },
    update: mutation(
      async ({ completed, id }: { completed: boolean; id: number }) =>
        await parseResponse(
          client.todos[":id"].$patch({
            json: { completed },
            param: { id: String(id) },
          })
        )
    ),
  },
});

export const api = createQueries(createClient());
