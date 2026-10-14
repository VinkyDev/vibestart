// Every app shape answers the API on :3000: Hono, or the framework that forwards to it.
const apiPort = 3000;

interface ApiUrlSource {
  readonly configured: string | undefined;
  readonly hostUri: string | undefined;
  readonly dev: boolean;
}

/** Development reaches the server on the machine Metro runs on; a release build needs EXPO_PUBLIC_API_URL. */
export const resolveApiUrl = ({ configured, hostUri, dev }: ApiUrlSource) => {
  if (configured !== undefined) {
    return configured;
  }

  const host = hostUri?.split(":")[0];

  if (dev && host !== undefined && host !== "") {
    return `http://${host}:${apiPort}`;
  }

  throw new Error("Set EXPO_PUBLIC_API_URL to the API origin for this build.");
};
