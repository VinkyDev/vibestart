import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { apiUrl } from "#src/env.ts";

// The scheme in `app.json`, which the server trusts as this app's origin.
const scheme = "my-app";

export const authClient = createAuthClient({
  baseURL: apiUrl,
  plugins: [expoClient({ scheme, storage: SecureStore, storagePrefix: scheme })],
});
