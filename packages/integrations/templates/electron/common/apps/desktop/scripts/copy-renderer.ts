import { cp, rm } from "node:fs/promises";
import path from "node:path";

const webDist = path.join(import.meta.dirname, "../../web/dist");
const renderer = path.join(import.meta.dirname, "../dist/renderer");

await rm(renderer, { force: true, recursive: true });
await cp(webDist, renderer, { recursive: true });
