import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useId, useState, useSyncExternalStore } from "react";

import { spring } from "#/lib/motion.ts";

const storageKey = (group: string) => `vibestart:docs-tab:${group}`;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};
const remember = (group: string, value: string) => {
  localStorage.setItem(storageKey(group), value);
  for (const listener of listeners) {
    listener();
  }
};

export const Tabs = ({
  children,
  group,
  items,
}: {
  readonly children: ReactNode;
  readonly group?: string;
  readonly items: readonly string[];
}) => {
  const id = useId();
  const [local, setLocal] = useState(items[0]);
  const stored = useSyncExternalStore(
    subscribe,
    () =>
      group === undefined ? null : localStorage.getItem(storageKey(group)),
    () => null
  );
  const value =
    stored !== null && items.includes(stored) ? stored : (local ?? "");

  return (
    <BaseTabs.Root
      className="bg-card shadow-rest my-6 overflow-hidden rounded-xl"
      onValueChange={(next: string) => {
        setLocal(next);
        if (group !== undefined) {
          remember(group, next);
        }
      }}
      value={value}
    >
      <BaseTabs.List className="border-border flex gap-1 overflow-x-auto border-b px-2">
        {items.map((item) => (
          <BaseTabs.Tab
            className="text-muted-foreground hover:text-foreground data-active:text-foreground focus-visible:ring-foreground/30 relative h-10 shrink-0 rounded-md px-2.5 font-mono text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
            key={item}
            value={item}
          >
            {item}
            {item === value && (
              <motion.span
                className="bg-foreground absolute inset-x-2.5 bottom-0 h-0.5 rounded-full"
                layoutId={id}
                transition={spring}
              />
            )}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {children}
    </BaseTabs.Root>
  );
};

export const Tab = ({
  children,
  value,
}: {
  readonly children: ReactNode;
  readonly value: string;
}) => (
  <BaseTabs.Panel
    className="outline-none [&_figure]:my-0 [&_figure]:rounded-none [&_figure]:shadow-none [&>p]:mx-4 [&>p]:my-3"
    value={value}
  >
    {children}
  </BaseTabs.Panel>
);
