import { createMemo, createSignal, Errored, Loading, Show } from "solid-js";

import { AccountMenu } from "@my-app/ui/components/account-menu";

import { authClient, getSession } from "#src/lib/auth.ts";

const signOut = async () => {
  const result = await authClient.signOut();

  if (result.error) {
    throw new Error(result.error.message);
  }

  window.location.replace("/");
};

export const Account = () => {
  const session = createMemo(async () => await getSession());
  const [error, setError] = createSignal("");

  return (
    <Errored
      fallback={(_error, reset) => (
        <button type="button" onClick={reset}>
          Retry session
        </button>
      )}
    >
      <Loading fallback={<span role="status">Loading account…</span>}>
        <Show when={session()?.user} fallback={<a href="/login">Sign in</a>}>
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
      </Loading>
    </Errored>
  );
};
