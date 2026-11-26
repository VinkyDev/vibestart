import { createAuthClient } from "better-auth/client";
import { createMemo, from } from "solid-js";

export const authClient = createAuthClient();

type SessionState = ReturnType<typeof authClient.useSession.get>;

export const useSession = () =>
  createMemo(() =>
    from<SessionState>((next) => authClient.useSession.subscribe(next))
  );
