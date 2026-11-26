import { getRouteApi } from "@tanstack/react-router";

import type { Stack } from "@vibestart/core";

import {
  addonsFlag,
  entryFromFlags,
  flagsOf,
  parseAddons,
  parseFlags,
} from "#/lib/stack.ts";

const home = getRouteApi("/");

export const useComposed = () => {
  const search = home.useSearch();
  const navigate = home.useNavigate();

  const addons = parseAddons(search.addons);

  return {
    addons,
    compose: (stack: Stack, nextAddons: readonly string[] = addons) => {
      void navigate({
        replace: true,
        resetScroll: false,
        search: { ...flagsOf(stack), addons: addonsFlag(nextAddons) },
      });
    },
    entry: entryFromFlags(parseFlags(search)),
  };
};
