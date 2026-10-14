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

  return health.data === true ? (
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
