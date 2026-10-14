import { LogOut } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Text } from "#src/components/ui/text.tsx";
import { authClient } from "#src/lib/auth-client.ts";

export const UserMenu = () => {
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
        hitSlop={8}
        onPress={async () => {
          await authClient.signOut();
        }}
      >
        <LogOut className="text-foreground" size={20} />
      </Pressable>
    </View>
  );
};
