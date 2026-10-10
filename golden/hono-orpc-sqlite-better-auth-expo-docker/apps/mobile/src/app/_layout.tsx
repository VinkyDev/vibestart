import "../../global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "#src/lib/query-client.ts";

const RootLayout = () => (
  <SafeAreaProvider>
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="index" options={{ title: "my-app" }} />
      </Stack>
      <StatusBar style="auto" />
    </QueryClientProvider>
  </SafeAreaProvider>
);

export default RootLayout;
