import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";

import { healthAtom } from "#src/lib/api.ts";
import { StatusLight } from "#src/components/status-light.tsx";

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
