import { Check, Fingerprint, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { fingerprint } from "@vibestart/core";
import { Button } from "@vibestart/ui/components/button";
import { cn } from "@vibestart/ui/lib/utils";

import { ease } from "#/lib/motion.ts";
import type { Project } from "#/lib/project.ts";
import { m } from "#/paraglide/messages.js";

const shown = 8;

const places = (hash: string) => [
  ...Array.from({ length: shown }, (_, index) => index),
  undefined,
  ...Array.from({ length: shown }, (_, index) => hash.length - shown + index),
];

export const FingerprintCheck = ({
  project,
  recorded,
}: {
  readonly project: Project;
  readonly recorded: string;
}) => {
  const [computed, setComputed] = useState<string | undefined>();
  const [hashing, setHashing] = useState(false);
  const matches = computed === recorded;
  const check = async () => {
    setHashing(true);
    setComputed(await fingerprint(project));
    setHashing(false);
  };

  return (
    <div
      className="border-border flex items-center gap-3 border-t pt-5"
      title={recorded}
    >
      <Fingerprint
        className="text-muted-foreground size-5 shrink-0"
        strokeWidth={1.5}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-xs">
          <span className="font-medium">{m.gate_fingerprint()}</span>
          <span className="text-muted-foreground">
            {" · "}
            {m.file_count({ count: project.files.length })}
          </span>
        </p>
        <p className="text-muted-foreground text-fine font-mono tracking-wide">
          {places(recorded).map((place, order) =>
            place === undefined ? (
              <span className="px-0.5" key="gap">
                …
              </span>
            ) : (
              <span
                className={cn(
                  "stagger transition-colors duration-300",
                  computed !== undefined &&
                    (computed[place] === recorded[place]
                      ? "text-added"
                      : "text-removed")
                )}
                key={place}
                style={{ "--delay": `${order * 30}ms` }}
              >
                {recorded[place]}
              </span>
            )
          )}
        </p>
      </div>
      <div aria-live="polite" className="ml-auto grid shrink-0 place-items-end">
        <AnimatePresence initial={false} mode="popLayout">
          {computed === undefined ? (
            <motion.span
              exit={{ opacity: 0, scale: 0.94 }}
              key="check"
              transition={{ duration: 0.2, ease }}
            >
              <Button
                disabled={hashing}
                onClick={() => {
                  void check();
                }}
                size="sm"
                variant="secondary"
              >
                {hashing ? m.gate_checking() : m.gate_check_here()}
              </Button>
            </motion.span>
          ) : (
            <motion.span
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium",
                matches
                  ? "bg-added/10 text-added"
                  : "bg-removed/10 text-removed"
              )}
              initial={{ opacity: 0, scale: 0.94 }}
              key="verdict"
              transition={{ delay: 0.55, duration: 0.35, ease }}
            >
              {matches ? (
                <Check className="size-3.5" strokeWidth={2} />
              ) : (
                <X className="size-3.5" strokeWidth={2} />
              )}
              {matches ? m.gate_match() : m.gate_mismatch()}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
