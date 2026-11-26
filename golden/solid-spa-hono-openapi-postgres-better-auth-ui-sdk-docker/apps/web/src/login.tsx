import { query, useLocation } from "@solidjs/router";
import { redirect } from "@solidjs/web";
import { createMemo, createSignal, Show } from "solid-js";

import { authClient, getSession } from "#src/lib/auth.ts";

const defaultTarget = "/todos";

const guest = query(async (target: string): Promise<boolean> => {
  if (await getSession()) {
    return redirect<boolean>(target);
  }

  return true;
}, "login-guest");

export const Login = () => {
  const location = useLocation();

  const target = () =>
    new URLSearchParams(location.search).get("redirect") === "/"
      ? "/"
      : defaultTarget;

  const allowed = createMemo(async () => await guest(target()));
  const [name, setName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [register, setRegister] = createSignal(false);
  const [error, setError] = createSignal("");
  const [pending, setPending] = createSignal(false);

  const submit = async (
    event: SubmitEvent & { currentTarget: HTMLFormElement }
  ) => {
    event.preventDefault();

    if (pending()) {
      return;
    }

    const credentials = { email: email(), password: password() };

    setPending(true);
    setError("");

    try {
      const result = register()
        ? await authClient.signUp.email({ ...credentials, name: name() })
        : await authClient.signIn.email(credentials);

      if (result.error) {
        setError(result.error.message ?? result.error.statusText);

        return;
      }

      window.location.replace(target());
    } finally {
      setPending(false);
    }
  };

  return (
    <Show when={allowed()}>
      <main class="mx-auto grid max-w-sm gap-4 px-6 py-12">
        <h1 class="text-3xl font-semibold">
          {register() ? "Create an account" : "Sign in"}
        </h1>
        <form
          class="grid gap-3"
          onSubmit={(event) => {
            submit(event).catch(() => {
              setError("Could not reach the server. Try again.");
            });
          }}
        >
          <Show when={register()}>
            <label>
              Name
              <input
                class="block w-full rounded border p-2"
                name="name"
                onInput={(event) => {
                  setName(event.currentTarget.value);
                }}
                value={name()}
                autocomplete="name"
                required
              />
            </label>
          </Show>
          <label>
            Email
            <input
              class="block w-full rounded border p-2"
              name="email"
              onInput={(event) => {
                setEmail(event.currentTarget.value);
              }}
              value={email()}
              type="email"
              autocomplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              class="block w-full rounded border p-2"
              name="password"
              onInput={(event) => {
                setPassword(event.currentTarget.value);
              }}
              value={password()}
              type="password"
              autocomplete={register() ? "new-password" : "current-password"}
              required
              minlength={8}
            />
          </label>
          <Show when={error()}>
            <p role="alert">{error()}</p>
          </Show>
          <button class="rounded border p-2" type="submit" disabled={pending()}>
            {register() ? "Sign up" : "Sign in"}
          </button>
          <button
            type="button"
            disabled={pending()}
            onClick={() => {
              setError("");
              setRegister((value) => !value);
            }}
          >
            {register()
              ? "Already have an account? Sign in"
              : "Need an account? Sign up"}
          </button>
        </form>
      </main>
    </Show>
  );
};
