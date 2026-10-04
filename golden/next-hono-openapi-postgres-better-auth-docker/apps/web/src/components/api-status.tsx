"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@my-app/ui/components/badge";

const checkHealth = async () => {
  const response = await fetch("/api/health");
  return response.ok;
};

export const ApiStatus = () => {
  const health = useQuery({ queryFn: checkHealth, queryKey: ["health"] });

  if (health.isPending) {
    return <Badge variant="outline">Checking</Badge>;
  }

  return health.data === true ? (
    <Badge>Connected</Badge>
  ) : (
    <Badge variant="destructive">Disconnected</Badge>
  );
};
