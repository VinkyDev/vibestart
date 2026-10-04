import { getRouteApi } from "@tanstack/react-router";

import type { Stack } from "@vibestart/core";

import { entryFromFlags, flagsOf, parseFlags } from "#/lib/stack.ts";

const home = getRouteApi("/");

export const useComposed = () => {
  const search = home.useSearch();
  const navigate = home.useNavigate();
  return {
    compose: (stack: Stack) => {
      void navigate({
        replace: true,
        resetScroll: false,
        search: flagsOf(stack),
      });
    },
    entry: entryFromFlags(parseFlags(search)),
  };
};
