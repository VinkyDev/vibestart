import { createFileRoute } from "@tanstack/react-router";

import { getServices } from "#src/server/context.ts";

const handleAuth = async ({ request }: { request: Request }) =>
  await getServices().auth.handler(request);

export const Route = createFileRoute("/api/auth/$")({
  server: { handlers: { GET: handleAuth, POST: handleAuth } },
});
