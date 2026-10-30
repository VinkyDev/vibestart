import { LogOut } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";

import { Text } from "#src/components/ui/text.tsx";
import { authClient } from "#src/lib/auth-client.ts";

export const UserMenu = () => {
  const [pending, setPending] = useState(false);
  const { data: session } = authClient.useSession();

  if (!session) {
    return null;
  }

  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-muted-foreground">{session.user.email}</Text>
      <Pressable
        accessibilityLabel="Sign out"
        accessibilityRole="button"
        disabled={pending}
        hitSlop={8}
        onPress={async () => {
          setPending(true);
          try {
            const { error } = await authClient.signOut();
            if (error) {
              Alert.alert("Could not sign out", "Please try again.");
            }
          } catch {
            Alert.alert("Could not sign out", "Please try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <LogOut className="text-foreground" size={20} />
      </Pressable>
    </View>
  );
};
