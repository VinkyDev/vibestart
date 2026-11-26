import { AtomRegistry } from "effect/reactivity";
import type { Atom } from "effect/reactivity";
import { createMemo, from, onCleanup } from "solid-js";

export const createRegistry = () => {
  const registry = AtomRegistry.make();
  onCleanup(() => {
    registry.dispose();
  });

  return registry;
};

export const atomValue = <A>(
  registry: AtomRegistry.AtomRegistry,
  atom: Atom.Atom<A>
) =>
  createMemo(() =>
    from<A>((next) => registry.subscribe(atom, next, { immediate: true }))
  );
