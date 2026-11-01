import { LogOut } from "lucide-react-native";
import { useTransition } from "react";
import { Alert, Pressable, View } from "react-native";

import { Text } from "#src/components/ui/text.tsx";
import { authClient } from "#src/lib/auth-client.ts";

const signOut = async () => {
  try {
    const { error } = await authClient.signOut();

    if (error) {
      Alert.alert("Could not sign out", "Please try again.");
    }
  } catch {
    Alert.alert("Could not sign out", "Please try again.");
  }
};

export const UserMenu = () => {
  const [pending, startTransition] = useTransition();
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
        onPress={() => {
          startTransition(signOut);
        }}
      >
        <LogOut className="text-foreground" size={20} />
      </Pressable>
    </View>
  );
};
