import { createSignal, Show } from "solid-js";

import { AccountMenu } from "@my-app/ui/components/account-menu";

import { authClient, useSession } from "#src/lib/auth.ts";

const signOut = async () => {
  const result = await authClient.signOut();

  if (result.error) {
    throw new Error(result.error.message);
  }

  window.location.replace("/");
};

export const Account = () => {
  const session = useSession();
  const [error, setError] = createSignal("");

  return (
    <Show
      when={!session().isPending}
      fallback={<output>Loading account…</output>}
    >
      <Show
        when={!session().error}
        fallback={
          <button
            type="button"
            onClick={() => {
              session()
                .refetch()
                .catch(() => {
                  setError("Could not reach the server.");
                });
            }}
          >
            Retry session
          </button>
        }
      >
        <Show
          when={session().data?.user}
          fallback={<a href="/login">Sign in</a>}
        >
          {(user) => (
            <AccountMenu
              name={user().name}
              onSignOut={() => {
                signOut().catch(() => {
                  setError("Could not sign out. Try again.");
                });
              }}
            />
          )}
        </Show>
        <Show when={error()}>
          <span role="alert">{error()}</span>
        </Show>
      </Show>
    </Show>
  );
};
