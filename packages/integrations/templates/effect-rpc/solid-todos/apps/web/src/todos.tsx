import { Exit, Option, Schema } from "effect";
import { AsyncResult } from "effect/reactivity";
import type { AtomRegistry } from "effect/reactivity";
import { createEffect, createSignal, For, Show } from "solid-js";

import { TodoTitle } from "@my-app/contracts";
import type { Todo } from "@my-app/contracts";

import {
  createTodoAtom,
  deleteTodoAtom,
  todosAtom,
  todosKeys,
  updateTodoAtom,
} from "#src/lib/api.ts";
import { atomValue, createRegistry } from "#src/lib/atoms.ts";

const decodeTitle = Schema.decodeUnknownExit(TodoTitle);

const TodoItem = (props: {
  todo: Todo;
  registry: AtomRegistry.AtomRegistry;
}) => {
  const update = updateTodoAtom(props.todo.id);
  const remove = deleteTodoAtom(props.todo.id);
  const updated = atomValue(props.registry, update);
  const removed = atomValue(props.registry, remove);
  const busy = () => updated().waiting || removed().waiting;

  return (
    <li class="flex min-w-0 flex-wrap items-center gap-3">
      <label class="flex min-w-0 flex-1 items-center gap-2">
        <input
          type="checkbox"
          checked={props.todo.completed}
          disabled={busy()}
          onChange={(event) => {
            const completed = event.currentTarget.checked;
            event.currentTarget.checked = props.todo.completed;
            props.registry.set(update, completed);
          }}
        />
        <span class="min-w-0 break-all">{props.todo.title}</span>
      </label>
      <button
        type="button"
        aria-label={`Delete ${props.todo.title}`}
        disabled={busy()}
        onClick={() => {
          props.registry.set(remove, undefined);
        }}
      >
        Delete
      </button>
      <Show
        when={
          AsyncResult.isFailure(updated()) || AsyncResult.isFailure(removed())
        }
      >
        <span role="alert">Could not save the change. Try again.</span>
      </Show>
    </li>
  );
};

export const Todos = () => {
  const registry = createRegistry();
  const rows = atomValue(registry, todosAtom);
  const created = atomValue(registry, createTodoAtom);
  const [draft, setDraft] = createSignal({ title: "" });
  const title = () => decodeTitle(draft().title);
  let submitted: { title: string } | undefined;

  createEffect(created, (result) => {
    if (
      !result.waiting &&
      AsyncResult.isSuccess(result) &&
      draft() === submitted
    ) {
      setDraft({ title: "" });
    }
  });

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const valid = title();

    if (created().waiting || Exit.isFailure(valid)) {
      return;
    }

    submitted = draft();
    registry.set(createTodoAtom, {
      payload: { title: valid.value },
      reactivityKeys: todosKeys,
    });
  };

  return (
    <main class="mx-auto grid max-w-3xl gap-4 px-6 py-12">
      <h1 class="text-3xl font-semibold">Todos</h1>
      <p>Private to your account.</p>
      <form class="flex flex-wrap items-center gap-2" onSubmit={submit}>
        <label for="todo-draft">New todo</label>
        <input
          id="todo-draft"
          class="rounded border px-2 py-1"
          maxlength={200}
          value={draft().title}
          onInput={(event) => {
            setDraft({ title: event.currentTarget.value });
          }}
        />
        <button
          class="rounded border px-3 py-1"
          type="submit"
          disabled={created().waiting || Exit.isFailure(title())}
        >
          Add
        </button>
      </form>
      <Show when={AsyncResult.isFailure(created())}>
        <p role="alert">Could not add the todo. Try again.</p>
      </Show>
      <Show when={AsyncResult.isFailure(rows())}>
        <p role="alert">
          Could not load todos.{" "}
          <button
            type="button"
            onClick={() => {
              registry.refresh(todosAtom);
            }}
          >
            Retry
          </button>
        </p>
      </Show>
      <Show when={AsyncResult.isInitial(rows())}>
        <p role="status">Loading todos…</p>
      </Show>
      <Show when={Option.getOrUndefined(AsyncResult.value(rows()))}>
        {(todos) => (
          <ul class="grid gap-2">
            <For
              keyed={(todo) => todo.id}
              each={todos()}
              fallback={<li>No todos yet.</li>}
            >
              {(todo) => <TodoItem registry={registry} todo={todo()} />}
            </For>
          </ul>
        )}
      </Show>
    </main>
  );
};
