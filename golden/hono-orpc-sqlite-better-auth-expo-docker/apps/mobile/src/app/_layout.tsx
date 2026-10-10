import "../../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

const RootLayout = () => (
  <SafeAreaProvider>
    <Stack>
      <Stack.Screen name="index" options={{ title: "my-app" }} />
    </Stack>
    <StatusBar style="auto" />
  </SafeAreaProvider>
);

export default RootLayout;
