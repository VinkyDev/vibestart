import { main } from "../src/deps/main.ts";

process.exitCode = await main(process.argv.slice(2));
