import { Schema } from "effect";
import Constants from "expo-constants";

import { resolveApiUrl } from "#src/lib/api-url.ts";

const HttpUrl = Schema.String.check(
  Schema.makeFilter((value) => {
    try {
      const { protocol } = new URL(value);

      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  })
);

const decodeConfigured = Schema.decodeUnknownSync(Schema.UndefinedOr(HttpUrl));

// Expo inlines EXPO_PUBLIC_* only where the code names the variable in full.
const configured = process.env.EXPO_PUBLIC_API_URL;

export const apiUrl = resolveApiUrl({
  configured: decodeConfigured(configured === "" ? undefined : configured),
  dev: __DEV__,
  hostUri: Constants.expoConfig?.hostUri,
});
