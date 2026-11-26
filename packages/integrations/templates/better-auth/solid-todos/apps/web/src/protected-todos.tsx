import { query } from "@solidjs/router";
import { redirect } from "@solidjs/web";
import { createMemo, Show } from "solid-js";

import { getSession } from "#src/lib/auth.ts";
import { Todos } from "#src/todos.tsx";

const requireSession = query(async (): Promise<boolean> => {
  if (!(await getSession())) {
    return redirect<boolean>("/login?redirect=%2Ftodos");
  }

  return true;
}, "todos-session");

export const ProtectedTodos = () => {
  const allowed = createMemo(async () => await requireSession());

  return (
    <Show when={allowed()}>
      <Todos />
    </Show>
  );
};
