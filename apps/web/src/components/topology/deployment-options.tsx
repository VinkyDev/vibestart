import type { LucideIcon } from "lucide-react";
import { Check, CircleHelp, Cloud, Container } from "lucide-react";
import { useId } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@vibestart/ui/components/popover";

import type { Choosing } from "#/components/topology/decision.tsx";
import { Swatch } from "#/components/topology/tile.tsx";
import { outcome } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const DeploymentOption = ({
  checked,
  description,
  disabled = false,
  purpose,
  icon,
  name,
  onChange,
}: {
  readonly checked: boolean;
  readonly description: string;
  readonly disabled?: boolean;
  readonly purpose: string;
  readonly icon: LucideIcon;
  readonly name: string;
  readonly onChange: () => void;
}) => {
  const descriptionId = useId();

  return (
    <label
      className="group/trigger bg-card shadow-rest transition-surface hover:shadow-lift has-focus-visible:focus-ring has-checked:border-tint relative flex min-h-12 min-w-0 cursor-pointer items-center gap-1.5 rounded-2xl border border-transparent px-2 has-disabled:cursor-not-allowed has-disabled:opacity-50 forced-colors:has-focus-visible:outline-2 forced-colors:has-focus-visible:outline-offset-2"
      title={description}
    >
      <input
        aria-describedby={descriptionId}
        aria-label={name}
        checked={checked}
        className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        disabled={disabled}
        onChange={onChange}
        type="checkbox"
      />
      <Swatch empty={!checked} icon={icon} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center justify-between gap-1">
          <span className="text-foreground text-sm font-medium">{name}</span>
          <span
            aria-hidden
            className="border-foreground/25 group-has-checked/trigger:bg-tint group-has-checked/trigger:border-tint grid size-3.5 shrink-0 place-items-center rounded-xs border"
          >
            {checked && <Check className="size-3 text-white" strokeWidth={3} />}
          </span>
        </span>
        <span className="text-muted-foreground text-xs leading-tight">
          {purpose}
        </span>
      </span>
      <span className="sr-only" id={descriptionId}>
        {description}
      </span>
    </label>
  );
};

export const DeploymentOptions = ({
  choosing,
}: {
  readonly choosing: Pick<
    Choosing,
    "addons" | "baseline" | "onAddons" | "onChoose"
  >;
}) => {
  const { addons, baseline, onAddons, onChoose } = choosing;
  const docker = baseline.deployment === "docker";
  const change = outcome(baseline, "deployment", docker ? null : "docker");
  const alchemy = addons.includes("alchemy");

  return (
    <div className="tint-deployment flex w-full min-w-0 flex-col gap-1">
      <div className="grid w-full min-w-0 flex-1 grid-cols-[repeat(auto-fit,minmax(min(100%,9.5rem),1fr))] gap-1.5">
        <DeploymentOption
          name="Docker"
          purpose={m.deployment_docker_purpose()}
          description={m.desc_docker()}
          icon={Container}
          checked={docker}
          disabled={change === undefined || change.changes.length > 0}
          onChange={() => {
            if (change !== undefined) {
              onChoose(change.entry);
            }
          }}
        />
        <DeploymentOption
          name="Alchemy"
          purpose={m.deployment_alchemy_purpose()}
          description={m.desc_alchemy()}
          icon={Cloud}
          checked={alchemy}
          onChange={() => {
            onAddons(
              alchemy
                ? addons.filter((id) => id !== "alchemy")
                : [...addons, "alchemy"]
            );
          }}
        />
      </div>
      <Popover>
        <PopoverTrigger className="group/help w-fit">
          <span className="text-muted-foreground group-hover/help:text-foreground group-focus-visible/help:focus-ring flex min-h-7 items-center gap-1.5 rounded-md px-2 text-xs forced-colors:group-focus-visible/help:outline-2">
            <CircleHelp aria-hidden className="size-3.5" />
            {m.deployment_help()}
          </span>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="w-80 max-w-(--available-width)"
        >
          <div className="flex flex-col gap-3 p-2.5">
            <PopoverTitle>{m.deployment_help()}</PopoverTitle>
            <dl className="grid gap-3">
              <div>
                <dt className="font-medium">Docker</dt>
                <dd className="text-muted-foreground leading-relaxed">
                  {m.deployment_docker_guide()}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Alchemy</dt>
                <dd className="text-muted-foreground leading-relaxed">
                  {m.deployment_alchemy_guide()}
                </dd>
              </div>
            </dl>
            <p className="border-border border-t pt-3 leading-relaxed">
              {m.deployment_together()}
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
