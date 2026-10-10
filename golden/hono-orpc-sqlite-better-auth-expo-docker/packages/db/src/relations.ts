import { defineRelations } from "drizzle-orm";

import { account, session, user, verification } from "#src/schema/auth.ts";
import { todos } from "#src/schema/todos.ts";

export const relations = defineRelations(
  { account, session, todos, user, verification },
  (r) => ({
    account: {
      user: r.one.user({ from: r.account.userId, to: r.user.id }),
    },
    session: {
      user: r.one.user({ from: r.session.userId, to: r.user.id }),
    },
    todos: {
      user: r.one.user({ from: r.todos.userId, to: r.user.id }),
    },
    user: {
      accounts: r.many.account(),
      sessions: r.many.session(),
      todos: r.many.todos(),
    },
  })
);
