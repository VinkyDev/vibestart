import { createFileRoute } from "@tanstack/react-router";

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
        TanStack Start, oRPC, PostgreSQL, Drizzle and Better Auth on Vite+.
      </CardDescription>
    </CardHeader>
    <CardContent className="flex items-center justify-between">
      <span>API status</span>
      <ApiStatus />
    </CardContent>
  </Card>
);

export const Route = createFileRoute("/")({
  component: HomePage,
});
