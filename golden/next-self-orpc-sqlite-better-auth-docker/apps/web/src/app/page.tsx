import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@my-app/ui/components/card";

import { ApiStatus } from "#src/components/api-status.tsx";

const HomePage = () => (
  <Card>
    <CardHeader>
      <CardTitle>my-app</CardTitle>
      <CardDescription>
        Next.js, oRPC, SQLite, Drizzle and Better Auth on Vite+.
      </CardDescription>
    </CardHeader>
    <CardContent className="flex items-center justify-between">
      <span>API status</span>
      <ApiStatus />
    </CardContent>
  </Card>
);

export default HomePage;
