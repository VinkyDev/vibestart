import { SessionPage } from "#src/session-page.tsx";
import { Todos } from "#src/todos.tsx";

export const ProtectedTodos = () => (
  <SessionPage signedIn redirectTo="/login?redirect=%2Ftodos">
    <Todos />
  </SessionPage>
);
