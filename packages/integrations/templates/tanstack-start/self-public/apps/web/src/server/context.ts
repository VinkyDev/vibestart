import { createDb } from "@my-app/db";

import { env } from "#src/server/env.ts";

const services = { db: createDb(env.DATABASE_URL) };

// Callers ask for services per request, so a runtime that cannot share them across requests changes only this module.
export const getServices = () => services;
