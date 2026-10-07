import { ArrowUpRight, Link2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import type { AddonInfo, IntegrationInfo, Stack } from "@vibestart/core";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@vibestart/ui/components/popover";
import { cn } from "@vibestart/ui/lib/utils";

import { useFocus, useFocusTarget } from "#/lib/focus.ts";
import { addonDescription, integrationDescription } from "#/lib/i18n.ts";
import { groupOf, tintClass } from "#/lib/roles.ts";
import { whyIncluded } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

export const CardHeading = ({
  homepage,
  name,
}: {
  readonly homepage: string | undefined;
  readonly name: string;
}) => (
  <div className="flex items-start justify-between gap-3">
    <PopoverTitle className="min-w-0">
      <span className="text-foreground flex items-center gap-2 pt-0.5 text-sm font-semibold tracking-tight">
        <span className="bg-tint size-2 shrink-0 rounded-full" />
        <span className="truncate">{name}</span>
      </span>
    </PopoverTitle>
    {homepage !== undefined && (
      <a
        aria-label={m.visit_site({ name })}
        className="text-muted-foreground hover:bg-tint-soft hover:text-tint focus-visible:focus-ring -mt-1 -mr-1.5 grid size-7 shrink-0 place-items-center rounded-full transition-colors outline-none"
        href={homepage}
        rel="noreferrer"
        target="_blank"
        title={new URL(homepage).host}
      >
        <ArrowUpRight className="size-4" strokeWidth={1.75} />
      </a>
    )}
  </div>
);

export const IntegrationCard = ({
  children,
  className,
  details,
  integration,
  side = "bottom",
  stack,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly details?: ReactNode;
  readonly integration: IntegrationInfo | AddonInfo;
  readonly side?: "bottom" | "top";
  readonly stack: Stack;
}) => {
  const [mode, setMode] = useState<"idle" | "hover" | "pinned" | "dismissed">(
    "idle"
  );
  const open = mode === "hover" || mode === "pinned";
  const pinned = mode === "pinned";
  const { focus } = useFocus();
  const { enter, leave } = useFocusTarget({ owner: integration.id });
  const focused =
    focus !== null && "owner" in focus && focus.owner === integration.id;
  const why =
    "kind" in integration ? whyIncluded(stack, integration) : undefined;
  const { homepage } = integration;

  return (
    <Popover
      onOpenChange={(next, eventDetails) => {
        if (eventDetails.reason === "trigger-press" && open && !pinned) {
          setMode("pinned");
          if (!next) {
            eventDetails.cancel();
          }
          return;
        }
        if (
          (pinned || mode === "dismissed") &&
          eventDetails.reason === "trigger-hover"
        ) {
          eventDetails.cancel();
          return;
        }
        if (next) {
          setMode(eventDetails.reason === "trigger-press" ? "pinned" : "hover");
          enter();
        } else {
          // An explicit dismissal stays closed until the pointer leaves or enters again.
          setMode(
            eventDetails.reason === "trigger-hover" ? "idle" : "dismissed"
          );
          leave();
        }
      }}
      open={open}
    >
      <PopoverTrigger
        className={cn("group/card flex min-w-0 text-left", className)}
        closeDelay={120}
        data-focused={focused ? "" : undefined}
        delay={180}
        onBlur={() => {
          if (!open) {
            leave();
          }
        }}
        onFocus={enter}
        onPointerEnter={() => {
          if (mode === "dismissed") {
            setMode("idle");
          }
          enter();
        }}
        onPointerLeave={() => {
          if (mode === "dismissed") {
            setMode("idle");
          }
          if (!open) {
            leave();
          }
        }}
        openOnHover={mode === "idle" || mode === "hover"}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-72"
        // A pointer that opens the card leaves focus where it is; a keyboard moves into the card to reach the link.
        initialFocus={(openType) => openType === "keyboard"}
        side={side}
        sideOffset={8}
      >
        <div
          className={cn(
            tintClass[groupOf(integration.id)],
            "flex flex-col gap-2 p-2.5 text-xs leading-relaxed"
          )}
        >
          <CardHeading homepage={homepage} name={integration.name} />
          <PopoverDescription>
            {"kind" in integration
              ? integrationDescription(integration)
              : addonDescription(integration)}
          </PopoverDescription>
          {details}
          {why !== undefined && (
            <p className="border-border text-foreground/80 mt-1 flex gap-2 border-t pt-2.5">
              <Link2 className="text-tint mt-0.5 size-3.5 shrink-0" />
              {why}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
