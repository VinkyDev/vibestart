import { createMemo, createSignal, Errored, For, Loading } from "solid-js";

import { api } from "#src/lib/api.ts";

export const Todos = () => {
  const [draft, setDraft] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [problem, setProblem] = createSignal("");
  const [revision, setRevision] = createSignal(0);
  const refresh = () => setRevision((value) => value + 1);

  const rows = createMemo(async () => {
    revision();

    return await api.todos.list();
  });

  const save = (operation: () => Promise<void>) => {
    if (busy()) {
      return;
    }

    setBusy(true);
    setProblem("");
    operation()
      .finally(() => {
        refresh();
        setBusy(false);
      })
      .catch(() => {
        setProblem(
          "Could not save the change. Check the list before retrying."
        );
      });
  };

  return (
    <main class="mx-auto grid max-w-3xl gap-4 px-6 py-12">
      <h1 class="text-3xl font-semibold">Todos</h1>
      <p>Private to your account.</p>
      <form
        class="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const title = draft().trim();

          if (!title) {
            return;
          }

          save(async () => {
            await api.todos.create({ title });
            setDraft("");
          });
        }}
      >
        <label for="todo-draft">New todo</label>
        <input
          id="todo-draft"
          class="rounded border px-2 py-1"
          required
          maxlength={200}
          value={draft()}
          disabled={busy()}
          onInput={(event) => {
            setDraft(event.currentTarget.value);
          }}
        />
        <button
          class="rounded border px-3 py-1"
          type="submit"
          disabled={busy() || !draft().trim()}
        >
          Add
        </button>
      </form>
      {busy() && <span role="status">Saving changes…</span>}
      {problem() && <p role="alert">{problem()}</p>}
      <Errored
        fallback={(_error, reset) => (
          <p role="alert">
            Could not load todos.{" "}
            <button
              type="button"
              onClick={() => {
                refresh();
                reset();
              }}
            >
              Retry
            </button>
          </p>
        )}
      >
        <Loading fallback={<p role="status">Loading todos…</p>}>
          <ul class="grid gap-2">
            <For
              keyed={(row) => row.id}
              each={rows()}
              fallback={<li>No todos yet.</li>}
            >
              {(todo) => (
                <li class="flex min-w-0 items-center justify-between gap-3">
                  <label class="flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={todo().completed}
                      disabled={busy()}
                      onChange={(event) => {
                        const completed = event.currentTarget.checked;
                        const { id } = todo();
                        event.currentTarget.checked = todo().completed;
                        save(async () => {
                          await api.todos.update({ id, completed });
                        });
                      }}
                    />
                    <span class="min-w-0 break-all">{todo().title}</span>
                  </label>
                  <button
                    type="button"
                    aria-label={`Delete ${todo().title}`}
                    disabled={busy()}
                    onClick={() => {
                      save(async () => {
                        await api.todos.delete({ id: todo().id });
                      });
                    }}
                  >
                    Delete
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Loading>
      </Errored>
    </main>
  );
};
