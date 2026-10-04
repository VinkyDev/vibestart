import { ParaglideMessage } from "@inlang/paraglide-js-react";
import { Link } from "@tanstack/react-router";
import type { Variants } from "motion/react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useRef } from "react";
import { stacks } from "virtual:vibestart";

import { buttonVariants } from "@vibestart/ui/components/button";
import { cn } from "@vibestart/ui/lib/utils";

import { Composer } from "#/components/home/composer.tsx";
import { CopyCommand } from "#/components/home/copy-command.tsx";
import { useFontsReady } from "#/lib/fonts.ts";
import { ease } from "#/lib/motion.ts";
import { m } from "#/paraglide/messages.js";

const rise: Variants = {
  hidden: { y: "108%" },
  shown: (line: number) => ({
    transition: { delay: 0.05 + line * 0.12, duration: 1.1, ease },
    y: 0,
  }),
};

const headlineMarkup = {
  em: ({ children }: { readonly children?: ReactNode }) => (
    <em className="text-spectrum">{children}</em>
  ),
};

const settle: Variants = {
  hidden: { opacity: 0, y: 8 },
  shown: { opacity: 1, transition: { delay: 0.4, duration: 0.9, ease }, y: 0 },
};

export const Hero = () => {
  const headline = useRef<HTMLHeadingElement>(null);
  const ready = useFontsReady(headline);

  return (
    <motion.section
      animate={ready ? "shown" : "hidden"}
      className="mx-auto flex w-full max-w-7xl flex-col px-6 pt-12 sm:pt-20 xl:pt-24"
      initial="hidden"
    >
      <h1 className="font-headline text-headline" ref={headline}>
        <span className="line-mask">
          <motion.span className="block" custom={0} variants={rise}>
            <ParaglideMessage markup={headlineMarkup} message={m.home_title} />
          </motion.span>
        </span>
        <span className="line-mask text-muted-foreground">
          <motion.span className="block" custom={1} variants={rise}>
            {m.home_title_rest()}
          </motion.span>
        </span>
      </h1>
      {/* Under the claim, the pitch and the way in. On a wide screen they sit on the composer's own columns,
          so the actions stand over the command they copy; actions wider than that column, as English sets
          them, widen it rather than wrap onto two rows. */}
      <motion.div
        className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(28rem,max-content)] xl:gap-0"
        variants={settle}
      >
        <p className="text-muted-foreground max-w-xl text-lg leading-relaxed text-pretty">
          {m.home_body({ stacks: stacks.length })}
        </p>
        <div className="flex flex-wrap items-center gap-3 xl:pl-8">
          <Link
            className={cn(
              buttonVariants(),
              "h-11 rounded-full px-6 text-base font-medium transition-transform active:scale-97"
            )}
            to="/studio"
          >
            {m.home_open()}
          </Link>
          <CopyCommand command="npx vibestart-cli" />
        </div>
      </motion.div>
      <div className="mt-14 sm:mt-16 xl:mt-20">
        <Composer />
      </div>
    </motion.section>
  );
};
