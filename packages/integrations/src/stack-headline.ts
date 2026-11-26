import { defineSlot } from "@vibestart/core";

/** One part of the stack as the home page names it: what it does, then what it is. */
export interface StackPart {
  readonly role: string;
  readonly name: string;
}

export const stackHeadline = defineSlot<StackPart>("app/stack-headline");

/** The stack's names as one English list: "A, B and C". */
export const listStack = (parts: readonly StackPart[]) => {
  const names = parts.map(({ name }) => name);

  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
    : names.join("");
};
