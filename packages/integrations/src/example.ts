import type { Stack } from "@vibestart/core";

export const authVariant = (stack: Stack) =>
  stack.auth === "better-auth" ? "auth" : "public";

export const apiVariant = (stack: Stack) =>
  stack.database === undefined ? "stateless" : authVariant(stack);

export const todosExample = (stack: Stack) =>
  stack.api !== undefined && stack.database !== undefined;

export const integrationExample = (stack: Stack) => {
  if (todosExample(stack)) {
    return "todos";
  }

  return stack.mode === "effect" ? "health" : undefined;
};

/** `auth` adds accounts to the todos; `account` is accounts alone; `none` has no data. */
export const exampleVariant = (stack: Stack) => {
  if (todosExample(stack)) {
    return authVariant(stack);
  }

  return stack.auth === "better-auth" ? "account" : "none";
};

export const hasTables = (stack: Stack) =>
  todosExample(stack) || stack.auth === "better-auth";
