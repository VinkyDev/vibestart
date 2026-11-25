import type { LucideIcon } from "lucide-react";
import { Check, Cloud, Container } from "lucide-react";
import { useId } from "react";

import type { Choosing } from "#/components/topology/decision.tsx";
import { Swatch } from "#/components/topology/tile.tsx";
import { outcome } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const DeploymentOption = ({
  checked,
  description,
  disabled = false,
  file,
  icon,
  name,
  onChange,
}: {
  readonly checked: boolean;
  readonly description: string;
  readonly disabled?: boolean;
  readonly file: string;
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
        <span className="text-muted-foreground text-fine truncate font-mono">
          {file}
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
    <div className="tint-deployment grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,9.5rem),1fr))] gap-1.5">
      <DeploymentOption
        name="Docker"
        file="Dockerfile"
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
        file="alchemy.run.ts"
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
  );
};
