import { motion, useReducedMotion } from "motion/react";

import { DotGrid } from "#src/components/dot-grid.tsx";
import { StackPlate } from "#src/components/stack-plate.tsx";

// Bottom to top. The top plate drifts first and each one below follows it.
const plates = [0.75, 0.5, 0.25, 0];

/** The `dark` class holds this panel to the dark tokens under either theme. */
export const AuthArt = () => {
  const reduced = useReducedMotion();

  return (
    <aside className="dark bg-card text-card-foreground relative isolate hidden flex-col justify-between gap-8 overflow-hidden rounded-3xl border p-10 lg:flex">
      <DotGrid />
      <div
        aria-hidden="true"
        className="flex flex-1 flex-col-reverse items-center justify-center"
      >
        {plates.map((delay, index) => (
          <motion.div
            animate={reduced === true ? {} : { y: [0, -12, 0] }}
            className="w-64 not-first:-mb-24"
            key={delay}
            transition={{
              delay,
              duration: 5,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            }}
          >
            <StackPlate active={index === plates.length - 1} />
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-2xl font-semibold tracking-tight text-balance">
          Your accounts, in your own database.
        </p>
        <p className="text-muted-foreground text-sm">
          Sessions are stored beside the rest of your data.
        </p>
      </div>
    </aside>
  );
};
