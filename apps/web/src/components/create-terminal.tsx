import { AnimatePresence, motion } from "motion/react";

import { cn } from "@vibestart/ui/lib/utils";

import { CopyGlyph, useCopy } from "#/components/copy.tsx";
import { flagTintClass } from "#/lib/roles.ts";
import { commandLine } from "#/lib/stack.ts";
import type { commandWords } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

export const CreateTerminal = ({
  words,
  name,
  onName,
  invalid,
}: {
  readonly words: ReturnType<typeof commandWords>;
  readonly name: string;
  readonly onName: (name: string) => void;
  readonly invalid: boolean;
}) => {
  const { copied, copy } = useCopy();
  return (
    <div className="bg-foreground/[0.04] relative rounded-2xl p-4">
      <button
        aria-label={m.copy_command()}
        className="bg-card text-muted-foreground shadow-rest hover:text-foreground absolute top-3 right-3 grid size-8 place-items-center rounded-lg transition-colors disabled:opacity-40"
        disabled={invalid}
        onClick={() => {
          void copy(commandLine(words));
        }}
        type="button"
      >
        <CopyGlyph copied={copied} />
      </button>
      <p className="text-snippet pr-10 font-mono leading-7 break-words">
        <span className="text-muted-foreground/50 select-none">$ </span>
        <span className="text-muted-foreground">{words.runner} </span>
        <input
          aria-invalid={invalid}
          aria-label={m.project_name()}
          className="text-foreground focus:border-foreground aria-invalid:border-removed aria-invalid:text-removed border-foreground/30 [field-sizing:content] w-auto min-w-[3ch] rounded-sm border-b border-dashed bg-transparent px-0.5 outline-none"
          onChange={(event) => {
            onName(event.target.value);
          }}
          spellCheck={false}
          value={name}
        />{" "}
        <AnimatePresence initial={false} mode="popLayout">
          {words.flags.map(({ kind, value }) => (
            <motion.span
              animate={{ filter: "blur(0px)", opacity: 1 }}
              // The gap is a margin, not a trailing space: an inline-block drops the white space at its end.
              className={cn(
                flagTintClass(kind),
                "mr-[1ch] inline-block whitespace-nowrap"
              )}
              exit={{ filter: "blur(4px)", opacity: 0 }}
              initial={{ filter: "blur(4px)", opacity: 0 }}
              key={kind}
              layout="position"
              transition={{ duration: 0.35 }}
            >
              <span className="text-muted-foreground/70">--{kind} </span>
              <span className="animate-flash text-tint rounded-sm" key={value}>
                {value}
              </span>
            </motion.span>
          ))}
        </AnimatePresence>
      </p>
    </div>
  );
};
