import type { Choosing } from "#/components/topology/decision.tsx";
import { outcome } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

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
    <div className="flex w-full items-center gap-1">
      <label
        className="hover:bg-foreground/5 flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-1.5 text-sm font-medium has-disabled:cursor-not-allowed has-disabled:opacity-50"
        title={m.desc_docker()}
      >
        <input
          className="accent-foreground size-4 shrink-0"
          type="checkbox"
          checked={docker}
          disabled={change === undefined || change.changes.length > 0}
          onChange={() => {
            if (change !== undefined) {
              onChoose(change.entry);
            }
          }}
        />
        Docker
      </label>
      <label
        className="hover:bg-foreground/5 flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-1.5 text-sm font-medium"
        title={m.desc_alchemy()}
      >
        <input
          className="accent-foreground size-4 shrink-0"
          type="checkbox"
          checked={alchemy}
          onChange={() => {
            onAddons(
              alchemy
                ? addons.filter((id) => id !== "alchemy")
                : [...addons, "alchemy"]
            );
          }}
        />
        Alchemy
      </label>
    </div>
  );
};
