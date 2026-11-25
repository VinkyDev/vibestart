import { e2eBaseURL, startTestServer } from "../support/server.ts";

export default async function setup() {
  return await startTestServer(e2eBaseURL);
}
