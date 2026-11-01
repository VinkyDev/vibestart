import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { View } from "react-native";

import { Text } from "#src/components/ui/text.tsx";
import { apiUrl } from "#src/env.ts";
import { healthAtom } from "#src/lib/api.ts";

export const ApiStatus = () => {
  const health = useAtomValue(healthAtom);

  if (AsyncResult.isInitial(health)) {
    return (
      <View className="flex-row items-center gap-2">
        <View className="bg-muted-foreground size-2 rounded-full" />
        <Text className="text-muted-foreground text-sm">Checking the API…</Text>
      </View>
    );
  }

  return AsyncResult.isSuccess(health) ? (
    <View className="flex-row items-center gap-2">
      <View className="bg-success size-2 rounded-full" />
      <Text className="text-sm">API connected</Text>
    </View>
  ) : (
    <View className="flex-row items-center gap-2">
      <View className="bg-destructive size-2 rounded-full" />
      <Text className="text-destructive flex-1 text-sm">
        API unreachable at {apiUrl}
      </Text>
    </View>
  );
};
