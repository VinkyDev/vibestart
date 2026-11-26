import { useNavigate } from "@solidjs/router";
import type { JSX } from "@solidjs/web";
import { createMemo, Show, untrack } from "solid-js";

import { authClient, useSession } from "#src/lib/auth.ts";

const Redirect = (props: { to: string }) => {
  const navigate = useNavigate();
  navigate(untrack(() => props.to), { replace: true });

  return null;
};

export const SessionPage = (props: {
  signedIn: boolean;
  redirectTo: string;
  children: JSX.Element;
}) => {
  const session = useSession();

  const checked = createMemo(async () => {
    await authClient.useSession.get().refetch();

    return true;
  });

  const viewer = () => {
    const { data, error } = session();

    if (error) {
      throw new Error(error.message);
    }

    return props.signedIn ? data?.user.id : !data;
  };

  return (
    <Show
      when={checked() && !session().isPending}
      fallback={<output>Checking session…</output>}
    >
      <Show keyed when={viewer()} fallback={<Redirect to={props.redirectTo} />}>
        {(_viewer) => props.children}
      </Show>
    </Show>
  );
};
