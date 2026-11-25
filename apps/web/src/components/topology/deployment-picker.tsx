import type { ReactNode } from "react";
import { useId } from "react";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@vibestart/ui/components/popover";

import type { Choosing } from "#/components/topology/decision.tsx";
import { outcome } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const DeploymentOption = ({
  checked,
  description,
  disabled = false,
  name,
  onChange,
}: {
  readonly checked: boolean;
  readonly description: string;
  readonly disabled?: boolean;
  readonly name: string;
  readonly onChange: () => void;
}) => {
  const descriptionId = useId();

  return (
    <label className="has-focus-visible:focus-ring hover:bg-foreground/[0.035] grid min-h-11 min-w-0 cursor-pointer grid-cols-[1rem_minmax(0,1fr)] content-start items-center gap-x-2 gap-y-1 rounded-lg px-2.5 py-2.5 has-disabled:cursor-not-allowed has-disabled:opacity-50 forced-colors:has-focus-visible:outline-2 forced-colors:has-focus-visible:outline-offset-2">
      <input
        aria-describedby={descriptionId}
        aria-label={name}
        checked={checked}
        className="size-4 cursor-pointer accent-(--tint) disabled:cursor-not-allowed"
        disabled={disabled}
        onChange={onChange}
        type="checkbox"
      />
      <span className="text-foreground text-sm font-medium">{name}</span>
      <span
        className="text-muted-foreground col-start-2 text-xs leading-snug"
        id={descriptionId}
      >
        {description}
      </span>
    </label>
  );
};

export const DeploymentPicker = ({
  children,
  choosing,
  className,
}: {
  readonly children: (summary: string) => ReactNode;
  readonly className: string;
  readonly choosing: Pick<
    Choosing,
    "addons" | "baseline" | "onAddons" | "onChoose"
  >;
}) => {
  const { addons, baseline, onAddons, onChoose } = choosing;
  const docker = baseline.deployment === "docker";
  const change = outcome(baseline, "deployment", docker ? null : "docker");
  const dockerLocked = change === undefined || change.changes.length > 0;
  const alchemy = addons.includes("alchemy");

  const summary =
    [docker && "Docker", alchemy && "Alchemy"].filter(Boolean).join(" · ") ||
    m.home_none();

  return (
    <Popover>
      <PopoverTrigger
        className={className}
        aria-label={`${m.kind_deployment()} · ${summary}`}
      >
        {children(summary)}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="tint-deployment w-80 max-w-(--available-width)"
      >
        <div className="px-2.5 pt-2 pb-1">
          <PopoverTitle>{m.kind_deployment()}</PopoverTitle>
          <div className="mt-1 text-xs">
            <PopoverDescription>
              {dockerLocked
                ? m.deployment_docker_locked()
                : m.deployment_together()}
            </PopoverDescription>
          </div>
        </div>
        <DeploymentOption
          name="Docker"
          description={m.deployment_docker_purpose()}
          checked={docker}
          disabled={dockerLocked}
          onChange={() => {
            if (change !== undefined) {
              onChoose(change.entry);
            }
          }}
        />
        <DeploymentOption
          name="Alchemy"
          description={m.deployment_alchemy_purpose()}
          checked={alchemy}
          onChange={() => {
            onAddons(
              alchemy
                ? addons.filter((id) => id !== "alchemy")
                : [...addons, "alchemy"]
            );
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
