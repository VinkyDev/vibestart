import type { ReactNode } from "react";
import { useRef, useState } from "react";

import type { Stack } from "@vibestart/core";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@vibestart/ui/components/popover";
import { cn } from "@vibestart/ui/lib/utils";

import { Picker } from "#/components/topology/picker.tsx";
import type { Project, StackEntry } from "#/lib/project.ts";
import type { Decision } from "#/lib/stack.ts";

export interface Choosing {
  readonly baseline: Stack;
  readonly addons: readonly string[];
  readonly onAddons: (addons: readonly string[]) => void;
  readonly project: Project;
  readonly onPreview: (entry: StackEntry | null) => void;
  readonly onChoose: (entry: StackEntry) => void;
}

/**
 * The trigger's box when its picker opened, moved only by page scroll. Previewing an option moves the
 * trigger, and a picker that followed it would slide another option under the pointer, which previews
 * that one and moves the trigger again.
 */
const pinned = (element: Element) => {
  const opened = element.getBoundingClientRect();
  const { scrollX, scrollY } = window;
  return {
    contextElement: element,
    getBoundingClientRect: () =>
      DOMRect.fromRect({
        height: opened.height,
        width: opened.width,
        x: opened.x + scrollX - window.scrollX,
        y: opened.y + scrollY - window.scrollY,
      }),
  };
};

export const DecisionTrigger = ({
  children,
  choosing: { addons, baseline, onChoose, onPreview, project },
  className,
  details,
  kind,
  side = "bottom",
}: {
  readonly children: ReactNode;
  readonly choosing: Choosing;
  readonly className?: string;
  readonly details?: ReactNode;
  readonly kind: Decision;
  readonly side?: "bottom" | "top" | "right" | "left";
}) => {
  const [open, setOpen] = useState(false);
  // Opening focuses the current option, whose focus previews nothing; the first option would preview itself.
  const current = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<ReturnType<typeof pinned>>();
  return (
    <Popover
      onOpenChange={(next) => {
        if (next && trigger.current !== null) {
          setAnchor(pinned(trigger.current));
        }
        setOpen(next);
        if (!next) {
          onPreview(null);
        }
      }}
      open={open}
    >
      <PopoverTrigger
        className={cn("group/trigger flex min-w-0 text-left", className)}
        ref={trigger}
      >
        <span className="group-focus-visible/trigger:focus-ring flex size-full min-w-0">
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        anchor={anchor}
        initialFocus={current}
        side={side}
        sideOffset={10}
      >
        <Picker
          addons={addons}
          currentRef={current}
          details={details}
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
      </PopoverContent>
    </Popover>
  );
};
