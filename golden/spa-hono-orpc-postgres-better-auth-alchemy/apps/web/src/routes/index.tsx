import { Link, createFileRoute } from "@tanstack/react-router";

import { Button } from "@my-app/ui/components/button";

import { ApiStatus } from "#src/components/api-status.tsx";
import { StackDiagram } from "#src/components/stack-diagram.tsx";

const layers = [
  { name: "React", role: "Frontend" },
  { name: "Better Auth", role: "Auth" },
  { name: "oRPC", role: "API" },
  { name: "Hono", role: "Backend" },
  { name: "Drizzle", role: "ORM" },
  { name: "PostgreSQL", role: "Database" },
  { name: "Vite+", role: "Toolchain" },
];

const HomePage = () => (
  <div className="grid items-center gap-12 py-4 lg:min-h-160 lg:grid-cols-2 lg:gap-16">
    <section className="flex flex-col items-start gap-6">
      <ApiStatus />
      <h1 className="text-5xl font-semibold tracking-tighter break-words sm:text-7xl">
        my-app
      </h1>
      <p className="text-muted-foreground max-w-md text-lg text-pretty">
        React, Hono, oRPC, PostgreSQL, Drizzle and Better Auth on Vite+.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link to="/todos" />} size="lg">
          Try the todo list
        </Button>
        <Button
          nativeButton={false}
          render={
            <a href="/api" rel="noreferrer" target="_blank">
              Open the API reference
            </a>
          }
          size="lg"
          variant="outline"
        />
      </div>
      <p className="text-muted-foreground text-sm">
        Start in{" "}
        <code className="text-foreground font-mono break-all">
          apps/web/src/routes/index.tsx
        </code>
        . Run{" "}
        <code className="text-foreground font-mono whitespace-nowrap">
          vp run ready
        </code>{" "}
        before you commit.
      </p>
    </section>
    <StackDiagram layers={layers} />
  </div>
);

export const Route = createFileRoute("/")({
  component: HomePage,
});
