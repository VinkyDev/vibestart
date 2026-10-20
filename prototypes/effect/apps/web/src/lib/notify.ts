import { Cause, Exit } from "effect";
import { toast } from "sonner";

import { TodoNotFound, Unauthorized } from "@my-app/contracts";

const messageFor = <E>(cause: Cause.Cause<E>) => {
  const error = Cause.squash(cause);

  if (error instanceof TodoNotFound) {
    return "That todo no longer exists.";
  }

  if (error instanceof Unauthorized) {
    return "Your session has ended. Sign in again.";
  }

  return "Something went wrong. Try again.";
};

/** Shows a failed call's typed error as a toast; anything else is a generic failure. */
export const toastFailure = <A, E>(exit: Exit.Exit<A, E>) => {
  if (Exit.isFailure(exit)) {
    toast.error(messageFor(exit.cause));
  }
};
