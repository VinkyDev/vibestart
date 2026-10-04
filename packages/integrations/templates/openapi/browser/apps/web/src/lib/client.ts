import { hc } from "hono/client";

import type { Api } from "@my-app/api";

export const createClient = () => hc<Api>("/api");
