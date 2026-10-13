import {
  contribute,
  defineIntegration,
  gettingStarted,
  renderFile,
} from "@vibestart/core";

import { serverEnv, stackHeadline } from "#/app.ts";
import {
  composeEnv,
  composeServices,
  composeVolumes,
  renderDevCompose,
} from "#/docker.ts";
import { quote } from "#/format.ts";
import { readmeLayers, readmeTagline } from "#/vite-plus/slots.ts";

export const postgres = defineIntegration({
  contribute: (ctx) => {
    const database = ctx.name.replaceAll("-", "_");
    return [
      contribute(serverEnv, {
        example: `postgres://postgres:postgres@localhost:5432/${database}`,
        name: "DATABASE_URL",
        schema: "z.url()",
      }),
      contribute(composeEnv, {
        name: "DATABASE_URL",
        value: `postgres://postgres:postgres@db:5432/${database}`,
      }),
      contribute(composeServices, {
        name: "db",
        readyWhen: "service_healthy",
        yaml: `  db:
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
      - db-data:/var/lib/postgresql`,
      }),
      contribute(composeVolumes, "db-data"),
      ...(ctx.has("docker")
        ? []
        : [
            renderFile("docker-compose.yml", (read) =>
              renderDevCompose(ctx, read)
            ),
          ]),
      contribute(readmeTagline, "PostgreSQL"),
      contribute(stackHeadline, "PostgreSQL"),
      contribute(readmeLayers, {
        choice: "PostgreSQL 18, Drizzle ORM v1",
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
