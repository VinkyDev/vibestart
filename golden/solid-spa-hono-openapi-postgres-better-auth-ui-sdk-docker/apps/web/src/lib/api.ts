import { parseResponse } from "hono/client";

import { createClient } from "#src/lib/client.ts";

const client = createClient().todos;

export const api = {
  todos: {
    list: async () => await parseResponse(client.$get()),
    create: async (json: { title: string }) =>
      await parseResponse(client.$post({ json })),
    update: async ({ id, completed }: { id: number; completed: boolean }) =>
      await parseResponse(
        client[":id"].$patch({ param: { id: String(id) }, json: { completed } })
      ),
    delete: async ({ id }: { id: number }) =>
      await parseResponse(client[":id"].$delete({ param: { id: String(id) } })),
  },
};
