import { useQuery } from "@tanstack/react-query";

import { StatusLight } from "#src/components/status-light.tsx";
import { api } from "#src/lib/api.ts";

export const ApiStatus = () => {
  const health = useQuery(api.health.queryOptions());

  if (health.isPending) {
    return <StatusLight status="checking" />;
  }

  return (
    <StatusLight status={health.isSuccess ? "connected" : "disconnected"} />
  );
};
