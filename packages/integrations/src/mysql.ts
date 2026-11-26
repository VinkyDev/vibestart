import { contribute, defineIntegration, gettingStarted } from "@vibestart/core";

import { ormRelease } from "#/database.ts";
import { databaseService } from "#/docker/database-service.ts";
import { stackHeadline } from "#/stack-headline.ts";
import { readmeLayers, readmeTagline } from "#/vite-plus/slots.ts";

export const mysql = defineIntegration({
  contribute: (ctx) => {
    const database = ctx.name.replaceAll("-", "_");

    return [
      ...databaseService(
        ctx,
        (host) => `mysql://root:mysql@${host}:3306/${database}`,
        `  db:
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
      - db-data:/var/lib/mysql`
      ),
      contribute(readmeTagline, "MySQL"),
      contribute(stackHeadline, { name: "MySQL", role: "Database" }),
      contribute(readmeLayers, {
        choice: `MySQL 8.4, ${ormRelease(ctx)}`,
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
