import Constants from "expo-constants";
import { z } from "zod";

import { resolveApiUrl } from "#src/lib/api-url.ts";

// Expo inlines EXPO_PUBLIC_* only where the code names the variable in full.
const configured = process.env.EXPO_PUBLIC_API_URL;

export const apiUrl = resolveApiUrl({
  configured: z
    .url()
    .optional()
    .parse(configured === "" ? undefined : configured),
  dev: __DEV__,
  hostUri: Constants.expoConfig?.hostUri,
});
