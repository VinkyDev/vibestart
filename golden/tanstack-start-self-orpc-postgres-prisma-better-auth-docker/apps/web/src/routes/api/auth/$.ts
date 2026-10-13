import { createFileRoute } from "@tanstack/react-router";

import { auth } from "#src/server/context.ts";

const handleAuth = async ({ request }: { request: Request }) =>
  await auth.handler(request);

export const Route = createFileRoute("/api/auth/$")({
  server: { handlers: { GET: handleAuth, POST: handleAuth } },
});
