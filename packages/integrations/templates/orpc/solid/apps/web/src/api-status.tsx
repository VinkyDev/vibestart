import { createMemo } from "solid-js";

import { api } from "#src/lib/api.ts";

export const ApiStatus = () => {
  const status = createMemo(async () => {
    try {
      await api.health();

      return "API connected";
    } catch {
      return "API unreachable";
    }
  });

  return <output>{status()}</output>;
};
