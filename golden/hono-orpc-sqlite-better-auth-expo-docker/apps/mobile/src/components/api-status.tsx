import { useQuery } from "@tanstack/react-query";

import { Text } from "#src/components/ui/text.tsx";
import { apiUrl } from "#src/env.ts";

const checkHealth = async () => {
  const response = await fetch(`${apiUrl}/api/health`);
  return response.ok;
};

export const ApiStatus = () => {
  const health = useQuery({ queryFn: checkHealth, queryKey: ["health"] });

  if (health.isPending) {
    return <Text className="text-muted-foreground">Checking the API…</Text>;
  }

  return health.data === true ? (
    <Text>API connected</Text>
  ) : (
    <Text className="text-destructive">API unreachable at {apiUrl}</Text>
  );
};
