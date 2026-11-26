import { contribute, defineIntegration, gettingStarted } from "@vibestart/core";

import { ormRelease } from "#/database.ts";
import { databaseService } from "#/docker/database-service.ts";
import { stackHeadline } from "#/stack-headline.ts";
import { readmeLayers, readmeTagline } from "#/vite-plus/slots.ts";

export const mongodb = defineIntegration({
  contribute: (ctx) => {
    const database = ctx.name.replaceAll("-", "_");

    return [
      ...databaseService(
        ctx,
        (host) => `mongodb://${host}:27017/${database}`,
        `  db:
    image: mongo:8
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.runCommand({ ping: 1 }).ok"]
      interval: 2s
      timeout: 5s
      retries: 30
    ports:
      - "127.0.0.1:27017:27017"
    volumes:
      - db-data:/data/db`
      ),
      contribute(readmeTagline, "MongoDB"),
      contribute(stackHeadline, { name: "MongoDB", role: "Database" }),
      contribute(readmeLayers, {
        choice: `MongoDB 8, ${ormRelease(ctx)}`,
        layer: "Database",
      }),
      contribute(gettingStarted, {
        run: "docker compose up -d db",
        note: {
          id: "any-mongodb",
          text: "or point DATABASE_URL at any MongoDB",
        },
      }),
    ];
  },
  id: "mongodb",
  kind: "database",
  name: "MongoDB",
  description: "MongoDB server, run by Docker Compose in development",
  homepage: "https://www.mongodb.com",
  provides: ["document-database"],
  requires: ["http-server", "document-orm", "node-runtime"],
});
