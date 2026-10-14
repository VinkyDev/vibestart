import { Link } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";

import { ApiStatus } from "#src/components/api-status.tsx";
import { Card } from "#src/components/ui/card.tsx";
import { Text } from "#src/components/ui/text.tsx";
import { UserMenu } from "#src/components/user-menu.tsx";
import { authClient } from "#src/lib/auth-client.ts";

const Home = () => {
  const { data: session } = authClient.useSession();

  return (
    <ScrollView
      className="bg-background"
      contentContainerClassName="gap-6 px-5 py-8"
    >
      <View className="gap-3">
        <Text className="text-4xl font-semibold tracking-tight">my-app</Text>
        <Text className="text-muted-foreground leading-6">
          Hono, oRPC, MongoDB, Mongoose, Better Auth and Expo on Vite+.
        </Text>
        <ApiStatus />
      </View>
      <Card>
        <UserMenu />
        <Link asChild href={session === null ? "/login" : "/todos"}>
          <Pressable className="flex-row items-center justify-between active:opacity-60">
            <Text className="text-primary font-semibold">
              {session === null ? "Sign in to keep todos" : "Open your todos"}
            </Text>
            <ChevronRight className="text-primary" size={18} />
          </Pressable>
        </Link>
      </Card>
    </ScrollView>
  );
};

export default Home;
