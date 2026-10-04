import { Dialog } from "@base-ui/react/dialog";
import { ChevronRight, Layers } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import type { Choosing } from "#/components/topology/decision.tsx";
import { Extensions } from "#/components/topology/extensions.tsx";
import { Picker } from "#/components/topology/picker.tsx";
import { Tile } from "#/components/topology/tile.tsx";
import { ease } from "#/lib/motion.ts";
import { addLabel, groupOf, roles, tintClass } from "#/lib/roles.ts";
import type { Decision } from "#/lib/stack.ts";
import { chosen, decisions, selected } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const Row = ({
  choosing: { addons, baseline, onChoose, onPreview, project },
  kind,
}: {
  readonly choosing: Choosing;
  readonly kind: Decision;
}) => {
  const [open, setOpen] = useState(false);
  const current = useRef<HTMLButtonElement>(null);
  const integration = chosen(baseline, kind);
  return (
    <Dialog.Root
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          onPreview(null);
        }
      }}
      open={open}
    >
      <Dialog.Trigger
        className={cn(
          tintClass[kind],
          "group/trigger hover:bg-foreground/[0.025] active:bg-foreground/[0.045] focus-visible:ring-foreground/30 flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
        )}
      >
        <Tile empty={integration === undefined} kind={kind} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-muted-foreground text-xs">
            {roles[kind].role}
          </span>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              className={cn(
                "truncate text-sm font-medium",
                integration === undefined
                  ? "text-muted-foreground"
                  : "text-foreground"
              )}
              exit={{ filter: "blur(4px)", opacity: 0, y: -6 }}
              initial={{ filter: "blur(4px)", opacity: 0, y: 6 }}
              key={integration?.id ?? "none"}
              transition={{ duration: 0.4, ease }}
            >
              {integration?.name ?? addLabel(kind)}
            </motion.span>
          </AnimatePresence>
        </span>
        <ChevronRight className="text-muted-foreground/60 size-4 shrink-0 transition-transform group-active/trigger:translate-x-0.5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="bg-foreground/20 fixed inset-0 z-50 transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          aria-label={roles[kind].question}
          className="bg-popover text-popover-foreground shadow-pop fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85svh] max-w-lg flex-col rounded-t-3xl transition-transform duration-300 ease-out outline-none data-ending-style:translate-y-full data-starting-style:translate-y-full"
          initialFocus={current}
        >
          <span
            aria-hidden
            className="bg-foreground/15 mx-auto mt-2 h-1 w-9 shrink-0 rounded-full"
          />
          <div className="overflow-y-auto overscroll-contain px-1.5 pt-1 pb-4">
            <Picker
              addons={addons}
              currentRef={current}
              kind={kind}
              onChoose={(entry) => {
                setOpen(false);
                onPreview(null);
                onChoose(entry);
              }}
              onPreview={onPreview}
              project={project}
              stack={baseline}
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export const StackList = ({
  choosing,
  className,
}: {
  readonly choosing: Choosing;
  readonly className?: string;
}) => {
  const foundation = selected(choosing.baseline).filter(
    (integration) => groupOf(integration.id) === "foundation"
  );
  return (
    <section
      aria-labelledby="stack-list-title"
      className={cn(
        "bg-card shadow-sheet rounded-sheet flex flex-col overflow-hidden",
        className
      )}
    >
      <h2
        className="font-headline text-foreground px-4 pt-4.5 pb-2 text-2xl"
        id="stack-list-title"
      >
        {m.studio_stack()}
      </h2>
      <ul className="divide-border/70 flex flex-col divide-y">
        {decisions.map((kind) => (
          <li key={kind}>
            <Row choosing={choosing} kind={kind} />
          </li>
        ))}
      </ul>
      <div className="tint-foundation border-border/70 flex flex-col gap-2.5 border-t px-4 pt-3.5 pb-4">
        <h3 className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Layers className="size-3.5" strokeWidth={1.75} />
          {m.engineering_capabilities()}
          <span className="ml-auto font-normal">{m.tool_builtin()}</span>
        </h3>
        <ul className="flex flex-wrap gap-1.5">
          {foundation.map(({ id, name }) => (
            <li
              className="bg-foreground/[0.04] text-foreground rounded-full px-3 py-1 text-xs font-medium"
              key={id}
            >
              {name}
            </li>
          ))}
        </ul>
        <div className="bg-foreground/[0.03] hover:bg-foreground/[0.05] has-data-popup-open:bg-foreground/[0.05] flex h-14 rounded-2xl transition-colors">
          <Extensions choosing={choosing} />
        </div>
      </div>
    </section>
  );
};
