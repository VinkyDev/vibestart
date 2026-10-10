import { ScrollView } from "react-native";

import { Card } from "#src/components/ui/card.tsx";
import { Text } from "#src/components/ui/text.tsx";

const Home = () => (
  <ScrollView className="bg-background" contentContainerClassName="gap-4 p-4">
    <Card>
      <Text className="text-2xl font-semibold">my-app</Text>
      <Text className="text-muted-foreground">
        Hono · oRPC · SQLite · Drizzle · Better Auth · Expo
      </Text>
    </Card>
  </ScrollView>
);

export default Home;
