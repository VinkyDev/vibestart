import { Badge } from "@my-app/ui/components/badge";
import { useQuery } from "@tanstack/react-query";

import { api } from "#src/lib/api.ts";

export const ApiStatus = () => {
  const health = useQuery(api.health.queryOptions());

  if (health.isPending) {
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

  return health.isSuccess ? (
    <Badge variant="outline">
      <span
        aria-hidden="true"
        className="bg-success ring-success/20 size-1.5 rounded-full ring-3"
      />
      Connected
    </Badge>
  ) : (
    <Badge variant="destructive">
      <span aria-hidden="true" className="bg-destructive size-1.5 rounded-full" />
      Disconnected
    </Badge>
  );
};
