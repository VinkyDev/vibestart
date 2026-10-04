import { Link } from "@tanstack/react-router";
import { compact } from "es-toolkit/array";
import { sumBy } from "es-toolkit/math";
import { CornerDownRight } from "lucide-react";
import type { Variants } from "motion/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { previewName, stacks } from "virtual:vibestart";

import type { Change, Stack } from "@vibestart/core";
import { buttonVariants } from "@vibestart/ui/components/button";
import { cn } from "@vibestart/ui/lib/utils";

import { Verified } from "#/components/command.tsx";
import { useComposed } from "#/components/home/use-composed.ts";
import { Tile } from "#/components/topology/tile.tsx";
import { list } from "#/lib/i18n.ts";
import { ease, spring } from "#/lib/motion.ts";
import { changeText, flagTintClass, roles, tintClass } from "#/lib/roles.ts";
import type { Decision } from "#/lib/stack.ts";
import {
  commandWords,
  decisions,
  flagsOf,
  optionsOf,
  outcome,
} from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const technologies = sumBy(
  decisions,
  (kind) => compact(optionsOf(kind)).length
);

interface Adjustment {
  readonly changes: readonly Change[];
  readonly version: number;
}

const arrive: Variants = {
  hidden: { opacity: 0, y: 8 },
  shown: (index: number) => ({
    opacity: 1,
    transition: { delay: 0.55 + index * 0.06, duration: 0.6, ease },
    y: 0,
  }),
};

const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  shown: { opacity: 1, transition: { delay: 0.45, duration: 0.9, ease }, y: 0 },
};

const fadeWidth = 32;

/**
 * On a phone a layer's options scroll sideways in one row, so an option that becomes the chosen one, set by
 * the reader or adjusted by another choice, is scrolled just into view, clear of the fade at the row's edge.
 * A ref callback, so it runs as the choice moves to a new option rather than on every render.
 */
const reveal = (option: HTMLLabelElement | null) => {
  const options = option?.parentElement ?? null;
  if (option === null || options === null) {
    return;
  }
  const start = option.offsetLeft - fadeWidth;
  const end = option.offsetLeft + option.offsetWidth + fadeWidth;
  if (start < options.scrollLeft) {
    options.scrollTo({ left: start });
  } else if (end > options.scrollLeft + options.clientWidth) {
    options.scrollTo({ left: end - options.clientWidth });
  }
};

const Layer = ({
  flash,
  index,
  kind,
  onChoose,
  stack,
}: {
  readonly flash: number | undefined;
  readonly index: number;
  readonly kind: Decision;
  readonly onChoose: (kind: Decision, id: string | null) => void;
  readonly stack: Stack;
}) => {
  const current = stack[kind] ?? null;
  return (
    <motion.div
      aria-label={roles[kind].role}
      className={cn(
        tintClass[kind],
        "relative grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-0.5 rounded-xl py-0.5 pl-3 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-3 sm:px-3 sm:py-1.5"
      )}
      custom={index}
      role="radiogroup"
      variants={arrive}
    >
      {flash !== undefined && (
        <span
          className="animate-flash pointer-events-none absolute inset-0 rounded-xl"
          key={flash}
        />
      )}
      <span className="text-snippet relative flex min-w-0 items-center gap-1.5 font-medium sm:gap-2.5 sm:text-sm">
        {/* A phone keeps the tint as a dot, so the row's width goes to the options. */}
        <span className="bg-tint size-1.5 shrink-0 rounded-full sm:hidden" />
        <span className="hidden sm:contents">
          <Tile kind={kind} />
        </span>
        <span className="truncate">{roles[kind].role}</span>
      </span>
      {/* Scrolls on a phone, so the chosen option's pill measures its moves against the scroll. */}
      <motion.span
        className="scroll-fade-x relative -my-1 flex gap-1 overflow-x-auto scroll-smooth py-1 pr-3 motion-reduce:scroll-auto sm:my-0 sm:flex-wrap sm:overflow-visible sm:mask-none sm:py-0 sm:pr-0"
        layoutScroll
      >
        {optionsOf(kind).map((option) => {
          const id = option?.id ?? null;
          const checked = id === current;
          const reachable = checked || outcome(stack, kind, id) !== undefined;
          return (
            <label
              className={cn(
                "has-focus-visible:focus-ring relative flex h-8 shrink-0 items-center rounded-full px-2.5 text-sm whitespace-nowrap transition-colors sm:px-3",
                checked
                  ? "text-tint font-medium"
                  : "text-muted-foreground hover:text-foreground",
                reachable ? "cursor-pointer" : "cursor-not-allowed opacity-40"
              )}
              key={id ?? "none"}
              ref={checked ? reveal : undefined}
            >
              <input
                checked={checked}
                className="sr-only"
                disabled={!reachable}
                name={`layer-${kind}`}
                onChange={() => {
                  onChoose(kind, id);
                }}
                type="radio"
              />
              {checked && (
                <motion.span
                  className="bg-tint-soft absolute inset-0 rounded-full"
                  layoutId={`layer-${kind}`}
                  transition={spring}
                />
              )}
              <span className="relative">{option?.name ?? m.home_none()}</span>
            </label>
          );
        })}
      </motion.span>
    </motion.div>
  );
};

const Halo = ({ stack }: { readonly stack: Stack }) => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-x-6 -bottom-8 -z-10 h-24 sm:inset-x-12"
  >
    {decisions.map((kind, index) => (
      <span
        className={cn(
          tintClass[kind],
          "bg-tint absolute top-0 left-(--at) h-full w-1/4 -translate-x-1/2 rounded-full blur-3xl transition-opacity duration-1000 motion-reduce:transition-none",
          stack[kind] === undefined || stack[kind] === null
            ? "opacity-0"
            : "opacity-40"
        )}
        key={kind}
        style={{ "--at": `${12.5 + (index / (decisions.length - 1)) * 75}%` }}
      />
    ))}
  </div>
);

export const Composer = () => {
  const { compose, entry } = useComposed();
  const [adjustment, setAdjustment] = useState<Adjustment>({
    changes: [],
    version: 0,
  });
  const words = commandWords(flagsOf(entry.stack), previewName, "pnpm");

  const choose = (kind: Decision, id: string | null) => {
    const next = outcome(entry.stack, kind, id);
    if (next === undefined) {
      return;
    }
    compose(next.entry.stack);
    setAdjustment({ changes: next.changes, version: adjustment.version + 1 });
  };

  return (
    <motion.div className="relative isolate" variants={rise}>
      <Halo stack={entry.stack} />
      <section className="bg-card shadow-sheet rounded-sheet grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="flex flex-col gap-4 px-3 pt-6 pb-5 sm:px-5 sm:pt-7">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5 px-3">
            <span className="font-headline text-4xl leading-none tabular-nums">
              {stacks.length}
            </span>
            <span className="text-sm font-medium">{m.home_stack_count()}</span>
            {/* On a phone the tally takes its own line rather than wrapping mid-phrase. */}
            <span className="text-muted-foreground basis-full text-sm sm:basis-auto">
              <span aria-hidden className="mr-2 hidden sm:inline">
                ·
              </span>
              {m.home_stack_math({
                layers: decisions.length,
                technologies,
              })}
            </span>
          </p>
          <div className="flex flex-col">
            {decisions.map((kind, index) => (
              <Layer
                flash={
                  adjustment.changes.some((change) => change.kind === kind)
                    ? adjustment.version
                    : undefined
                }
                index={index}
                key={kind}
                kind={kind}
                onChoose={choose}
                stack={entry.stack}
              />
            ))}
          </div>
        </div>

        <div className="bg-foreground/[0.03] border-border flex flex-col gap-5 border-t p-5 sm:p-8 lg:border-t-0 lg:border-l">
          <p className="text-snippet font-mono leading-7 break-words">
            <span className="text-muted-foreground/50 select-none">$ </span>
            <span className="text-muted-foreground">
              {words.runner} {words.name}{" "}
            </span>
            {words.flags.map(({ kind, value }) => (
              // The gap is a margin, not a trailing space: an inline-block drops the white space at its end.
              <span
                className={cn(
                  flagTintClass(kind),
                  "mr-[1ch] inline-block whitespace-nowrap"
                )}
                key={kind}
              >
                <span className="text-muted-foreground/70">--{kind} </span>
                <span
                  className="animate-flash text-tint rounded-sm"
                  key={value}
                >
                  {value}
                </span>
              </span>
            ))}
          </p>
          <Verified verification={entry.verification} />
          <AnimatePresence initial={false} mode="popLayout">
            {adjustment.changes.length > 0 && (
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="text-muted-foreground flex gap-2 text-xs leading-relaxed"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0, y: 4 }}
                key={adjustment.version}
                transition={{ duration: 0.35, ease }}
              >
                <CornerDownRight className="mt-0.5 size-3.5 shrink-0" />
                {m.home_adjusted({
                  changes: list(
                    "conjunction",
                    adjustment.changes.map(changeText)
                  ),
                })}
              </motion.p>
            )}
          </AnimatePresence>
          <Link
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "mt-1 h-10 self-start rounded-full px-5 text-sm font-medium lg:mt-auto"
            )}
            search={flagsOf(entry.stack)}
            to="/studio"
          >
            {m.home_open_stack()}
          </Link>
        </div>
      </section>
    </motion.div>
  );
};
