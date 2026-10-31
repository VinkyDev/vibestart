import path from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp, rm } from "node:fs/promises";

import { Effect, Redacted } from "effect";

import { Database } from "#src/index.ts";
import { migrateDatabase } from "#src/migrate.ts";

export const makeTestDatabase = Effect.gen(function* () {
  const directory = yield* Effect.acquireRelease(
    Effect.tryPromise(async () => await mkdtemp(path.join(tmpdir(), "my-app-test-"))),
    (folder) => Effect.promise(async () => { await rm(folder, { recursive: true, force: true }); })
  );

  const url = Redacted.make(path.join(directory, "test.db"));
  yield* migrateDatabase.pipe(Effect.provide(Database.layerUrl(url)));

  return url;
});
