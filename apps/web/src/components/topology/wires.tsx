import { AnimatePresence, motion } from "motion/react";

import type { Edge } from "#/components/topology/layout.ts";
import { stage } from "#/components/topology/layout.ts";
import { ease } from "#/lib/motion.ts";

export const Wires = ({ wires }: { readonly wires: readonly Edge[] }) => (
  <svg
    className="pointer-events-none absolute inset-0 overflow-visible"
    height={stage.height}
    viewBox={`0 0 ${stage.width} ${stage.height}`}
    width={stage.width}
  >
    <defs>
      {wires.map((wire) => (
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={`wire-${wire.id}`}
          key={wire.id}
          x1={wire.start.x}
          x2={wire.end.x}
          y1={wire.start.y}
          y2={wire.end.y}
        >
          <stop offset="0" stopColor={`var(--tint-${wire.from})`} />
          <stop offset="1" stopColor={`var(--tint-${wire.to})`} />
        </linearGradient>
      ))}
    </defs>
    <AnimatePresence>
      {wires.map((wire, index) =>
        wire.ghost ? (
          <motion.path
            animate={{ opacity: 1 }}
            d={wire.path}
            exit={{ opacity: 0 }}
            fill="none"
            initial={{ opacity: 0 }}
            key={`${wire.id}-ghost`}
            stroke="oklch(0.21 0.015 270 / 18%)"
            strokeDasharray="1 7"
            strokeLinecap="round"
            strokeWidth={1.5}
          />
        ) : (
          <motion.g
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key={wire.id}
            transition={{ duration: 0.5 }}
          >
            <motion.path
              animate={{ pathLength: 1 }}
              d={wire.path}
              fill="none"
              initial={{ pathLength: 0 }}
              stroke={`url(#wire-${wire.id})`}
              strokeLinecap="round"
              strokeOpacity={0.55}
              strokeWidth={1.5}
              transition={{ delay: 0.2, duration: 1, ease }}
            />
            <path
              className="animate-comet comet"
              d={wire.path}
              fill="none"
              pathLength={1}
              stroke={`url(#wire-${wire.id})`}
              strokeDasharray="0.06 1.1"
              strokeLinecap="round"
              strokeWidth={3}
              style={{ "--delay": `${index * 0.7}s` }}
            />
          </motion.g>
        )
      )}
    </AnimatePresence>
  </svg>
);
