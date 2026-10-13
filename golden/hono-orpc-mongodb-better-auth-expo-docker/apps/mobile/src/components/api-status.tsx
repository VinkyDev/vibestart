import { useQuery } from "@tanstack/react-query";

import { Text } from "#src/components/ui/text.tsx";
import { apiUrl } from "#src/env.ts";
import { api } from "#src/lib/api.ts";

export const ApiStatus = () => {
  const health = useQuery(api.health.queryOptions());

  if (health.isPending) {
    return <Text className="text-muted-foreground">Checking the API…</Text>;
  }

  return health.isSuccess ? (
    <Text>API connected</Text>
  ) : (
    <Text className="text-destructive">API unreachable at {apiUrl}</Text>
  );
};
