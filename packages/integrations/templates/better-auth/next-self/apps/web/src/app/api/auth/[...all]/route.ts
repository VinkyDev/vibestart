import { getServices } from "#src/server/context.ts";

const handleAuth = async (request: Request) =>
  await getServices().auth.handler(request);

export const GET = handleAuth;
export const POST = handleAuth;
