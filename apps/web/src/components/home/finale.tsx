import { Link } from "@tanstack/react-router";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import type { PointerEvent } from "react";
import { useEffect, useId, useRef } from "react";

import { buttonVariants } from "@vibestart/ui/components/button";
import { cn } from "@vibestart/ui/lib/utils";

import { CopyCommand } from "#/components/home/copy-command.tsx";
import {
  backInk,
  clearing,
  Logo,
  strokes,
  strokeWidth,
} from "#/components/logo.tsx";
import { repository } from "#/lib/site.ts";
import { m } from "#/paraglide/messages.js";

const footerLink =
  "hover:text-foreground decoration-foreground/30 underline-offset-4 transition-colors hover:underline";

const fall = (layer: number) =>
  ({
    damping: 16,
    delay: layer * 0.16,
    stiffness: 120,
    type: "spring",
  }) as const;
const height = -7;

const Mark = ({ inView }: { readonly inView: boolean }) => {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { damping: 20, stiffness: 120 });
  const y = useSpring(pointerY, { damping: 20, stiffness: 120 });
  const back = { x, y };
  // The front stroke and the clearing it cuts share one drop, so the gap is always where the stroke is.
  const drop = useMotionValue(height);
  const front = {
    x: useTransform(x, (value) => value * 2.2),
    y: useTransform(() => y.get() * 2.2 + drop.get()),
  };
  useEffect(() => {
    const falling = inView ? animate(drop, 0, fall(1)) : undefined;
    return () => {
      falling?.stop();
    };
  }, [drop, inView]);
  const clip = useId();

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - box.left) / box.width - 0.5);
    pointerY.set((event.clientY - box.top) / box.height - 0.5);
  };

  return (
    <div
      aria-hidden
      className="relative order-first aspect-square w-24 shrink-0 self-start sm:order-none sm:w-72 sm:self-center lg:self-auto xl:mr-8 xl:w-80"
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      onPointerMove={follow}
    >
      <svg
        className="size-full overflow-visible"
        fill="none"
        strokeLinecap="round"
        viewBox="0 0 32 32"
      >
        {/* The clearing follows the front stroke, so the gap moves with it. */}
        <clipPath id={clip}>
          <motion.path clipRule="evenodd" d={clearing} style={front} />
        </clipPath>
        <g clipPath={`url(#${clip})`}>
          <motion.g style={back}>
            <motion.path
              className="stroke-foreground"
              d={strokes.back}
              strokeOpacity={backInk}
              strokeWidth={strokeWidth}
              animate={inView ? { opacity: 1, y: 0 } : undefined}
              initial={{ opacity: 0, y: height }}
              transition={fall(0)}
            />
          </motion.g>
        </g>
        <motion.path
          animate={inView ? { opacity: 1 } : undefined}
          className="stroke-foreground"
          d={strokes.front}
          initial={{ opacity: 0 }}
          strokeWidth={strokeWidth}
          style={front}
          transition={fall(1)}
        />
      </svg>
    </div>
  );
};

export const Finale = () => {
  const section = useRef<HTMLElement>(null);
  const inView = useInView(section, { amount: 0.4, once: true });

  return (
    <section
      className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-6 pt-32 pb-8 lg:gap-28 lg:pt-52"
      ref={section}
    >
      <div className="flex flex-col justify-between gap-10 sm:gap-16 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-8">
          <h2 className="font-headline text-finale text-balance">
            {m.home_cta_title()}
          </h2>
          <p className="text-muted-foreground max-w-md text-lg leading-relaxed text-pretty">
            {m.home_cta_body()}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className={cn(
                buttonVariants(),
                "h-11 rounded-full px-6 text-base font-medium"
              )}
              to="/studio"
            >
              {m.home_open()}
            </Link>
            <CopyCommand command="npx vibestart-cli" />
          </div>
        </div>
        <Mark inView={inView} />
      </div>

      <footer className="border-border text-muted-foreground flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t pt-6 text-sm">
        <p className="flex items-center gap-2.5">
          <Logo className="text-foreground size-5" />
          <span>
            {m.home_built_on()}{" "}
            <a
              className={cn(footerLink, "text-foreground")}
              href="https://viteplus.dev"
              rel="noreferrer"
              target="_blank"
            >
              Vite+
            </a>
          </span>
        </p>
        <nav className="flex items-center gap-5">
          <Link className={footerLink} params={{ _splat: "" }} to="/docs/$">
            {m.nav_docs()}
          </Link>
          <Link className={footerLink} to="/studio">
            {m.nav_studio()}
          </Link>
          <a
            className={footerLink}
            href={repository}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </nav>
      </footer>
    </section>
  );
};
