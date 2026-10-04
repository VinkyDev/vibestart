import "server-only";
import { headers } from "next/headers";
import { cache } from "react";

import { getServices } from "#src/server/context.ts";

export const getSession = cache(async () => {
  const requestHeaders = await headers();
  return await getServices().auth.api.getSession({ headers: requestHeaders });
});
