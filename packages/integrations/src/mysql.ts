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
import { readmeLayers, readmeTagline } from "#/vite-plus/slots.ts";

export const mysql = defineIntegration({
  contribute: (ctx) => {
    const database = ctx.name.replaceAll("-", "_");
    return [
      contribute(serverEnv, {
        example: `mysql://root:mysql@localhost:3306/${database}`,
        name: "DATABASE_URL",
        schema: "z.url()",
      }),
      contribute(composeEnv, {
        name: "DATABASE_URL",
        value: `mysql://root:mysql@db:3306/${database}`,
      }),
      contribute(composeServices, {
        name: "db",
        readyWhen: "service_healthy",
        yaml: `  db:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: ${database}
      MYSQL_ROOT_PASSWORD: mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1", "-uroot", "-pmysql"]
      interval: 2s
      timeout: 5s
      retries: 30
    ports:
      - "127.0.0.1:3306:3306"
    volumes:
      - db-data:/var/lib/mysql`,
      }),
      contribute(composeVolumes, "db-data"),
      ...(ctx.has("docker")
        ? []
        : [
            renderFile("docker-compose.yml", (read) =>
              renderDevCompose(ctx, read)
            ),
          ]),
      contribute(readmeTagline, "MySQL"),
      contribute(stackHeadline, "MySQL"),
      contribute(readmeLayers, {
        choice: "MySQL 8.4, Drizzle ORM v1",
        layer: "Database",
      }),
      contribute(gettingStarted, {
        run: "docker compose up -d db",
        note: {
          id: "any-mysql",
          text: "or point DATABASE_URL at any MySQL",
        },
      }),
    ];
  },
  id: "mysql",
  kind: "database",
  name: "MySQL",
  description: "MySQL server, run by Docker Compose in development",
  homepage: "https://www.mysql.com",
  provides: ["database-server", "sql-database"],
  requires: ["http-server", "sql-orm"],
});
