import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";

import { Badge } from "@my-app/ui/components/badge";

import { healthAtom } from "#src/lib/api.ts";

export const ApiStatus = () => {
  const health = useAtomValue(healthAtom);

  if (AsyncResult.isInitial(health)) {
    return (
      <Badge variant="outline">
        <span
          aria-hidden="true"
          className="bg-muted-foreground size-1.5 rounded-full motion-safe:animate-pulse"
        />
        Checking
      </Badge>
    );
  }

  return AsyncResult.isSuccess(health) ? (
    <Badge variant="outline">
      <span
        aria-hidden="true"
        className="bg-success ring-success/20 size-1.5 rounded-full ring-3"
      />
      Connected
    </Badge>
  ) : (
    <Badge variant="destructive">
      <span
        aria-hidden="true"
        className="bg-destructive size-1.5 rounded-full"
      />
      Disconnected
    </Badge>
  );
};
