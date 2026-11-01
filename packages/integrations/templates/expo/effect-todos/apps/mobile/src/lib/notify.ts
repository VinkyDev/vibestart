import { Cause, Exit } from "effect";
import { Alert } from "react-native";

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

export const alertFailure = <A, E>(exit: Exit.Exit<A, E>) => {
  if (Exit.isFailure(exit) && !Cause.hasInterruptsOnly(exit.cause)) {
    Alert.alert("Could not save todo", messageFor(exit.cause));
  }
};
