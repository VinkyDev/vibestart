import { useSyncExternalStore } from "react";

const subscribe = () => () => {
  // Hydration changes the snapshot without an external subscription to clean up.
};

const clientSnapshot = () => true;
const serverSnapshot = () => false;

export const useHydrated = () =>
  useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
