import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { cn } from "@my-app/ui/lib/utils";

import { DotGrid } from "#src/components/dot-grid.tsx";
import { StackPlate } from "#src/components/stack-plate.tsx";

interface Layer {
  readonly name: string;
  readonly role: string;
}

const assemble = {
  hidden: {},
  shown: { transition: { delayChildren: 0.1, staggerChildren: 0.08 } },
};

const drop = {
  hidden: { opacity: 0, y: -48 },
  shown: { opacity: 1, y: 0 },
};

const walkInterval = 550;

/** Calls `onStep` for each layer in turn, ending back on the first, and returns what stops it early. */
const walkLayers = (count: number, onStep: (index: number) => void) => {
  let step = 0;

  const timer = setInterval(() => {
    step += 1;
    onStep(step % count);

    if (step === count) {
      clearInterval(timer);
    }
  }, walkInterval);

  return () => {
    clearInterval(timer);
  };
};

/**
 * Each plate overlaps the one below it, and later elements paint on top, so the DOM runs bottom to top and
 * `flex-col-reverse` puts the first layer back on top.
 */
export const StackDiagram = ({ layers }: { layers: readonly Layer[] }) => {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const [active, setActive] = useState(0);
  const walking = reduced !== true && !hovered;

  // A request travels down the stack once on load; pointing at a layer takes over from it.
  useEffect(
    () => (walking ? walkLayers(layers.length, setActive) : undefined),
    [layers.length, walking]
  );

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ bounce: 0.25, duration: 0.6, type: "spring" }}
    >
      <div className="relative isolate">
        <DotGrid />
        <motion.ul
          animate="shown"
          aria-label="The stack"
          className="flex flex-col-reverse pt-14 pb-14"
          initial="hidden"
          onPointerEnter={() => {
            setHovered(true);
          }}
          variants={assemble}
        >
          {layers.map((layer, index) => ({ index, layer })).toReversed().map(
            ({ index, layer: { name, role } }) => (
              <li
                className="relative flex h-13 items-center pl-44 sm:pl-64"
                key={role}
                onPointerEnter={() => {
                  setActive(index);
                }}
              >
                <motion.div
                  className="absolute top-1/2 left-0 w-36 -translate-y-[44%] sm:w-52"
                  variants={drop}
                >
                  {/* The layers above the active one lift to reveal it. */}
                  <motion.div animate={{ y: index < active ? -20 : 0 }}>
                    <StackPlate active={index === active} />
                  </motion.div>
                </motion.div>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-1/2 left-36 h-px w-6 transition-colors duration-300 sm:left-52 sm:w-10",
                    index === active ? "bg-primary" : "bg-border"
                  )}
                />
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">{role}</span>
                  <span
                    className={cn(
                      "font-medium transition-colors duration-300",
                      index !== active && "text-muted-foreground"
                    )}
                  >
                    {name}
                  </span>
                </div>
              </li>
            )
          )}
        </motion.ul>
      </div>
    </MotionConfig>
  );
};
