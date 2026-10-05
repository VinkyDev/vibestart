import { Sparkles } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@vibestart/ui/components/popover";
import { cn } from "@vibestart/ui/lib/utils";

import { CopyGlyph, useCopy } from "#/components/copy.tsx";
import { repository } from "#/lib/site.ts";
import { m } from "#/paraglide/messages.js";

const skill = `npx skills add ${repository.replace("https://github.com/", "")} --skill vibestart`;

/**
 * The way out of choosing a stack, so it sits with the choices rather than with the command they produce.
 * The prompt names no stack and ends on an open "My needs:" line: the reader adds their own words in the
 * agent, and the skill guides the agent to choose.
 */
export const AgentHandoff = ({
  className,
}: {
  readonly className?: string;
}) => {
  const { copied, copy } = useCopy();
  const prompt = m.create_agent_prompt({ skill });

  return (
    <Popover>
      <PopoverTrigger className={cn("group/agent", className)}>
        <span className="bg-card text-foreground shadow-rest group-hover/agent:shadow-lift group-data-popup-open/agent:shadow-lift group-focus-visible/agent:focus-ring transition-surface flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap">
          <Sparkles className="size-3.5" strokeWidth={2} />
          {m.create_agent_trigger()}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80" sideOffset={8}>
        <div className="flex flex-col gap-3 p-2.5">
          <div>
            <PopoverTitle>{m.create_agent_title()}</PopoverTitle>
            <div className="mt-1 text-xs leading-relaxed">
              <PopoverDescription>{m.create_agent_about()}</PopoverDescription>
            </div>
          </div>
          <p className="bg-foreground/[0.04] text-muted-foreground rounded-xl p-3 text-xs leading-relaxed whitespace-pre-line">
            {prompt}
          </p>
          <button
            className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground/30 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2"
            onClick={() => {
              void copy(prompt);
            }}
            type="button"
          >
            <CopyGlyph copied={copied} />
            <span aria-live="polite">
              {copied ? m.create_agent_copied() : m.create_agent_copy()}
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
