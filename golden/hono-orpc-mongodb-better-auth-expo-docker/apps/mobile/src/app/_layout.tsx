import "../../global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { authClient } from "#src/lib/auth-client.ts";
import { queryClient } from "#src/lib/query-client.ts";

const RootLayout = () => {
  // The guards decide which screens exist, so they wait for the stored session.
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return null;
  }

  const signedIn = session !== null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack>
          <Stack.Screen name="index" options={{ title: "my-app" }} />
          <Stack.Protected guard={signedIn}>
            <Stack.Screen name="todos" options={{ title: "Todos" }} />
          </Stack.Protected>
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="login" options={{ title: "Sign in" }} />
          </Stack.Protected>
        </Stack>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

export default RootLayout;
