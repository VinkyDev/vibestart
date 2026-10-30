import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react-native";
import { Alert, Pressable, View } from "react-native";

import { Text } from "#src/components/ui/text.tsx";
import { authClient } from "#src/lib/auth-client.ts";

export const UserMenu = () => {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();

      if (error) {
        throw new Error("Could not sign out. Please try again.");
      }
    },
    onError: () => {
      Alert.alert("Could not sign out", "Please try again.");
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  if (!session) {
    return null;
  }

  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-muted-foreground">{session.user.email}</Text>
      <Pressable
        accessibilityLabel="Sign out"
        accessibilityRole="button"
        disabled={signOut.isPending}
        hitSlop={8}
        onPress={() => {
          signOut.mutate();
        }}
      >
        <LogOut className="text-foreground" size={20} />
      </Pressable>
    </View>
  );
};
