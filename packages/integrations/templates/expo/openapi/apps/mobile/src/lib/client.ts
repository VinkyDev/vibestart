import { hc } from "hono/client";

import type { Api } from "@my-app/api";

import { apiUrl } from "#src/env.ts";

export const createClient = () => hc<Api>(`${apiUrl}/api`);
