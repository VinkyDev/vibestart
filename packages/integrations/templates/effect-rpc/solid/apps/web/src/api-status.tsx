import { AsyncResult } from "effect/reactivity";

import { healthAtom } from "#src/lib/api.ts";
import { atomValue, createRegistry } from "#src/lib/atoms.ts";

export const ApiStatus = () => {
  const health = atomValue(createRegistry(), healthAtom);

  const status = () => {
    const result = health();

    if (AsyncResult.isInitial(result)) {
      return "Checking API…";
    }

    return AsyncResult.isSuccess(result) ? "API connected" : "API unreachable";
  };

  return <output>{status()}</output>;
};
