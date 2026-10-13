import { useQuery } from "@tanstack/react-query";

import { Badge } from "@my-app/ui/components/badge";

import { api } from "#src/lib/api.ts";

export const ApiStatus = () => {
  const health = useQuery(api.health.queryOptions());

  if (health.isPending) {
    return <Badge variant="outline">Checking</Badge>;
  }

  return health.isSuccess ? (
    <Badge>Connected</Badge>
  ) : (
    <Badge variant="destructive">Disconnected</Badge>
  );
};
