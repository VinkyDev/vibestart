import { Agent, setGlobalDispatcher } from "undici";

// Node 24's bundled Undici can crash on macOS socket QoS calls (nodejs/undici#5544), so tests use the catalog's fixed dispatcher.
const dispatcher = new Agent();
setGlobalDispatcher(dispatcher);

export const closeTestHttp = async () => {
  await dispatcher.close();
};
