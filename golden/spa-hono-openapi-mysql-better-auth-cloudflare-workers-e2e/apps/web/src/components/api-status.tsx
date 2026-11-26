import { useQuery } from "@tanstack/react-query";

import { StatusLight } from "#src/components/status-light.tsx";

const checkHealth = async () => {
  const response = await fetch("/api/health");

  return response.ok;
};

export const ApiStatus = () => {
  const health = useQuery({ queryFn: checkHealth, queryKey: ["health"] });

  if (health.isPending) {
    return <StatusLight status="checking" />;
  }

  return (
    <StatusLight status={health.data === true ? "connected" : "disconnected"} />
  );
};
