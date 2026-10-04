import { defineRelations } from "drizzle-orm";

import { account, session, user, verification } from "#src/schema/auth.ts";

export const relations = defineRelations(
  { account, session, user, verification },
  (r) => ({
    account: {
      user: r.one.user({ from: r.account.userId, to: r.user.id }),
    },
    session: {
      user: r.one.user({ from: r.session.userId, to: r.user.id }),
    },
    user: {
      accounts: r.many.account(),
      sessions: r.many.session(),
    },
  })
);
