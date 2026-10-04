import { isEqual } from "es-toolkit/predicate";
import type { Dispatch, SetStateAction } from "react";
import { createContext, use } from "react";

import type { Group } from "#/lib/roles.ts";
import { groupOf } from "#/lib/roles.ts";

export type Focus =
  | { readonly group: Group }
  | { readonly owner: string }
  | null;

export const FocusContext = createContext<{
  readonly focus: Focus;
  readonly setFocus: Dispatch<SetStateAction<Focus>>;
}>({
  focus: null,
  setFocus: () => {
    // The default context is only read outside a provider, where nothing can move focus.
  },
});

export const useFocus = () => use(FocusContext);

export const FocusScope = createContext<Focus>(null);

export const restoreFocus = (
  current: Focus,
  target: NonNullable<Focus>,
  enclosing: Focus
): Focus => (isEqual(current, target) ? enclosing : current);

export const useFocusTarget = (target: NonNullable<Focus>) => {
  const { setFocus } = useFocus();
  const enclosing = use(FocusScope);
  return {
    enter: () => {
      setFocus(target);
    },
    leave: () => {
      // A delayed popup close must not clear a newer card's focus.
      setFocus((current) => restoreFocus(current, target, enclosing));
    },
  };
};

export const focusesOwner = (focus: Focus, owner: string): boolean => {
  if (focus === null) {
    return true;
  }
  if ("owner" in focus) {
    return focus.owner === owner;
  }
  return groupOf(owner) === focus.group;
};

export const focusesGroup = (focus: Focus, group: Group) =>
  focus !== null &&
  ("group" in focus ? focus.group === group : groupOf(focus.owner) === group);
