import { mkdir, writeFile } from "node:fs/promises";
import type { ServerResponse } from "node:http";
import path from "node:path";

import type { Connect, Plugin } from "vite-plus";
import { runnerImport } from "vite-plus";

import { previewDirectory, previewPath } from "../src/lib/project.ts";
import type * as Stacks from "./stacks.ts";

const moduleId = "virtual:vibestart";
const resolved = `\0${moduleId}`;

export const importStacks = async () => {
  const imported = await runnerImport<typeof Stacks>("/plugin/stacks.ts", {
    oxc: { exclude: ["**/templates/**"] },
    root: path.dirname(import.meta.dirname),
  });

  return imported.module;
};

/**
 * Serves the registry and the verification index as `virtual:vibestart`, each stack's preview as a JSON file at
 * `previewPath`, and `vibestart.jsonc`'s JSON Schema at the path of `blueprintSchemaUrl`. The generator formats with oxfmt's native binding, so it runs here in Node, not in the browser.
 * Previews are files, not modules: thousands of them, each holding whole projects, would make the bundler parse
 * and keep every one.
 */
export const vibestart = (): Plugin => {
  let stacks: Promise<typeof Stacks> | undefined;

  const loadStacks = async () => {
    stacks ??= importStacks();
    const pending = stacks;

    try {
      return await pending;
    } catch (error) {
      if (stacks === pending) {
        stacks = undefined;
      }

      throw error;
    }
  };

  return {
    configureServer: (server) => {
      const { base } = server.config;

      const fileAt = async (url: string) => {
        const loaded = await loadStacks();

        if (url === `${base}${loaded.blueprintSchema.path}`) {
          return loaded.blueprintSchema.source;
        }

        const label = loaded.stackLabels.find(
          (candidate) => url === `${base}${previewPath(candidate)}`
        );

        return label === undefined
          ? undefined
          : JSON.stringify(await loaded.stackPreview(label));
      };

      const serveFile = async (
        url: string | undefined,
        response: ServerResponse,
        next: Connect.NextFunction
      ) => {
        // Every file this plugin serves is JSON; other requests skip loading the generator.
        if (url?.startsWith(base) !== true || !url.endsWith(".json")) {
          next();

          return;
        }

        let file: string | undefined;

        try {
          file = await fileAt(url);
        } catch (error) {
          next(error);

          return;
        }

        if (file === undefined) {
          next();

          return;
        }

        response.setHeader("Content-Type", "application/json");
        response.end(file);
      };

      server.middlewares.use((request, response, next) => {
        void serveFile(request.url, response, next);
      });
    },
    async generateBundle() {
      const loaded = await loadStacks();
      this.emitFile({
        fileName: loaded.blueprintSchema.path,
        source: loaded.blueprintSchema.source,
        type: "asset",
      });
    },
    async writeBundle({ dir }) {
      if (dir === undefined) {
        this.error("Stack previews require a build output directory.");
      }

      const started = performance.now();
      const loaded = await loadStacks();
      await mkdir(path.join(dir, previewDirectory), { recursive: true });

      let bytes = 0;

      for (const label of loaded.stackLabels) {
        try {
          // Write each preview before generating the next to keep peak memory bounded.
          const preview = JSON.stringify(await loaded.stackPreview(label));
          await writeFile(path.join(dir, previewPath(label)), preview);
          bytes += Buffer.byteLength(preview);
        } catch (error) {
          throw new Error(`Could not write the preview for ${label}`, {
            cause: error,
          });
        }
      }

      const seconds = ((performance.now() - started) / 1000).toFixed(1);
      this.info(
        `Wrote ${loaded.stackLabels.length} stack previews (${bytes} bytes) in ${seconds}s.`
      );
    },
    load: async (id) => {
      if (id !== resolved) {
        return null;
      }

      const loaded = await loadStacks();

      return [
        `export const previewName = ${JSON.stringify(loaded.previewName)};`,
        `export const registry = ${JSON.stringify(loaded.registryInfo)};`,
        `export const verificationIndex = ${JSON.stringify(await loaded.verificationIndex())};`,
      ].join("\n");
    },
    name: "vibestart",
    resolveId: (id) => (id === moduleId ? resolved : null),
  };
};
