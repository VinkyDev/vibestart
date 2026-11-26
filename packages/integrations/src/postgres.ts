import { contribute, defineIntegration, gettingStarted } from "@vibestart/core";

import { ormRelease } from "#/database.ts";
import { databaseService } from "#/docker/database-service.ts";
import { quote } from "#/format.ts";
import { stackHeadline } from "#/stack-headline.ts";
import { readmeLayers, readmeTagline } from "#/vite-plus/slots.ts";

export const postgres = defineIntegration({
  contribute: (ctx) => {
    const database = ctx.name.replaceAll("-", "_");

    return [
      ...databaseService(
        ctx,
        (host) => `postgres://postgres:postgres@${host}:5432/${database}`,
        `  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_DB: ${database}
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
    healthcheck:
      test: ["CMD-SHELL", ${quote(`pg_isready -U postgres -d ${database}`)}]
      interval: 2s
      timeout: 5s
      retries: 15
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - db-data:/var/lib/postgresql`
      ),
      contribute(readmeTagline, "PostgreSQL"),
      contribute(stackHeadline, { name: "PostgreSQL", role: "Database" }),
      contribute(readmeLayers, {
        choice: `PostgreSQL 18, ${ormRelease(ctx)}`,
        layer: "Database",
      }),
      contribute(gettingStarted, {
        run: "docker compose up -d db",
        note: {
          id: "any-postgres",
          text: "or point DATABASE_URL at any Postgres",
        },
      }),
    ];
  },
  id: "postgres",
  kind: "database",
  name: "PostgreSQL",
  description: "PostgreSQL server, run by Docker Compose in development",
  homepage: "https://www.postgresql.org",
  provides: ["database-server", "sql-database"],
  requires: ["http-server", "sql-orm"],
});
