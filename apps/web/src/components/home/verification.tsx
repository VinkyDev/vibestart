import { ArrowUp } from "lucide-react";
import { useInView } from "motion/react";
import { Suspense, useRef } from "react";
import { stacks } from "virtual:vibestart";

import { Reveal } from "#/components/home/reveal.tsx";
import { useComposed } from "#/components/home/use-composed.ts";
import { Placeholder, Record } from "#/components/home/verification/record.tsx";
import { m } from "#/paraglide/messages.js";

export const Verification = () => {
  const { entry } = useComposed();
  const card = useRef<HTMLDivElement>(null);
  // The record loads the stack's files, so it waits until the reader reaches it.
  const reached = useInView(card, { amount: 0.25, once: true });
  const subject =
    stacks.find((candidate) => candidate.label === entry.verification?.label) ??
    entry;

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pt-28 sm:gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-20 lg:pt-44">
      <Reveal className="flex flex-col gap-6">
        <h2 className="font-headline text-section text-balance whitespace-pre-line">
          {m.home_verify_title()}
        </h2>
        <p className="text-muted-foreground max-w-md text-base leading-relaxed text-pretty">
          {m.home_verify_body()}
        </p>
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <ArrowUp className="size-3.5" strokeWidth={1.75} />
          {m.home_verify_follow()}
        </p>
      </Reveal>

      <Reveal className="min-w-0" delay={0.1}>
        <div
          className="bg-card shadow-sheet rounded-sheet min-h-[29rem] min-w-0 sm:min-h-[31rem]"
          ref={card}
        >
          {reached ? (
            <Suspense fallback={<Placeholder />}>
              <Record entry={entry} key={entry.label} subject={subject} />
            </Suspense>
          ) : (
            <Placeholder />
          )}
        </div>
      </Reveal>
    </section>
  );
};
