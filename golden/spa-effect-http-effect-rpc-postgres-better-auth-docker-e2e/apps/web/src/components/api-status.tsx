import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";

import { StatusLight } from "#src/components/status-light.tsx";
import { healthAtom } from "#src/lib/api.ts";

export const ApiStatus = () => {
  const health = useAtomValue(healthAtom);

  if (AsyncResult.isInitial(health)) {
    return <StatusLight status="checking" />;
  }

  return (
    <StatusLight
      status={AsyncResult.isSuccess(health) ? "connected" : "disconnected"}
    />
  );
};
