import { Check, ChevronsUpDown, Info, Puzzle } from "lucide-react";
import { useState } from "react";
import { registry } from "virtual:vibestart";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@vibestart/ui/components/popover";

import type { Choosing } from "#/components/topology/decision.tsx";
import { IntegrationCard } from "#/components/topology/integration-card.tsx";
import { Swatch } from "#/components/topology/tile.tsx";
import { ToolDetails } from "#/components/topology/tool-details.tsx";
import { useFocusTarget } from "#/lib/focus.ts";
import { m } from "#/paraglide/messages.js";

export const Extensions = ({ choosing }: { readonly choosing: Choosing }) => {
  const { addons, baseline, onAddons } = choosing;
  const [open, setOpen] = useState(false);
  const { enter, leave } = useFocusTarget({ group: "foundation" });
  const names = registry.addons
    .filter(({ id }) => addons.includes(id))
    .map(({ name }) => name);
  return registry.addons.length === 0 ? null : (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          enter();
        } else {
          leave();
        }
      }}
    >
      <PopoverTrigger
        aria-label={m.addons()}
        className="group/extensions flex h-full min-w-0 flex-1 text-left"
        onFocus={enter}
        onBlur={() => {
          if (!open) {
            leave();
          }
        }}
        onPointerEnter={enter}
        onPointerLeave={() => {
          if (!open) {
            leave();
          }
        }}
      >
        <span className="group-focus-visible/extensions:focus-ring flex size-full min-w-0 items-center gap-2 rounded-2xl px-2.5">
          <Swatch icon={Puzzle} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-muted-foreground text-xs">{m.addons()}</span>
            <span className="text-foreground truncate text-sm font-medium">
              {names.length === 0 ? m.extensions_none() : names.join(" · ")}
            </span>
          </span>
          <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0 opacity-60 transition-opacity group-hover/extensions:opacity-100" />
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        side="top"
        sideOffset={10}
        initialFocus={(openType) => openType === "keyboard"}
      >
        <div className="p-2.5">
          <PopoverTitle>{m.addons()}</PopoverTitle>
          <div className="mt-1 text-xs leading-relaxed">
            <PopoverDescription>{m.extensions_about()}</PopoverDescription>
          </div>
          <fieldset className="mt-3 flex flex-col gap-1">
            <legend className="sr-only">{m.addons()}</legend>
            {registry.addons.map((addon) => {
              const taken = addons.includes(addon.id);
              return (
                <div
                  className="hover:bg-foreground/[0.04] flex items-center gap-2 rounded-xl px-2 transition-colors"
                  key={addon.id}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-3">
                    <input
                      checked={taken}
                      className="peer sr-only"
                      onChange={() => {
                        onAddons(
                          registry.addons
                            .map(({ id }) => id)
                            .filter((id) =>
                              id === addon.id ? !taken : addons.includes(id)
                            )
                        );
                      }}
                      type="checkbox"
                    />
                    <span className="border-foreground/25 peer-checked:bg-foreground peer-checked:border-foreground peer-focus-visible:ring-foreground/30 text-background grid size-4 shrink-0 place-items-center rounded-xs border transition-colors peer-focus-visible:ring-2">
                      {taken && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="text-foreground text-sm font-medium">
                      {addon.name}
                    </span>
                    {addon.default && (
                      <span className="bg-foreground/5 text-muted-foreground text-fine rounded-full px-1.5 py-px">
                        {m.addon_default()}
                      </span>
                    )}
                  </label>
                  <IntegrationCard
                    className="shrink-0"
                    details={<ToolDetails id={addon.id} stack={baseline} />}
                    integration={addon}
                    side="top"
                    stack={baseline}
                  >
                    <span className="text-muted-foreground group-hover/card:bg-foreground/5 group-focus-visible/card:focus-ring grid size-7 place-items-center rounded-full transition-colors">
                      <Info className="size-4" strokeWidth={1.75} />
                      <span className="sr-only">
                        {m.learn_about({ name: addon.name })}
                      </span>
                    </span>
                  </IntegrationCard>
                </div>
              );
            })}
          </fieldset>
        </div>
      </PopoverContent>
    </Popover>
  );
};
