import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { redirect } from "next/navigation";

import { TodoList } from "#src/components/todo-list.tsx";
import { getQueryClient, serverApi } from "#src/server/query.ts";
import { getSession } from "#src/server/session.ts";

const TodosPage = async () => {
  if (!(await getSession())) {
    redirect("/login?redirect=%2Ftodos");
  }

  const queryClient = getQueryClient();
  await queryClient.query(serverApi.todos.list.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TodoList />
    </HydrationBoundary>
  );
};

export default TodosPage;
