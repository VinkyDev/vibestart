import { Link } from "expo-router";
import { ScrollView } from "react-native";

import { ApiStatus } from "#src/components/api-status.tsx";
import { Card } from "#src/components/ui/card.tsx";
import { Text } from "#src/components/ui/text.tsx";
import { UserMenu } from "#src/components/user-menu.tsx";
import { authClient } from "#src/lib/auth-client.ts";

const Home = () => {
  const { data: session } = authClient.useSession();
  return (
    <ScrollView className="bg-background" contentContainerClassName="gap-4 p-4">
      <Card>
        <Text className="text-2xl font-semibold">my-app</Text>
        <Text className="text-muted-foreground">
          Hono · oRPC · SQLite · Drizzle · Better Auth · Expo
        </Text>
        <ApiStatus />
      </Card>
      <Card>
        <UserMenu />
        {session === null && (
          <Link className="text-primary underline" href="/login">
            Sign in
          </Link>
        )}
      </Card>
    </ScrollView>
  );
};

export default Home;
