import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TodoList } from "#src/components/todo-list.tsx";
import { getQueryClient, serverApi } from "#src/server/query.ts";

const TodosPage = async () => {
  const queryClient = getQueryClient();
  await queryClient.query(serverApi.todos.list.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TodoList />
    </HydrationBoundary>
  );
};

export default TodosPage;
