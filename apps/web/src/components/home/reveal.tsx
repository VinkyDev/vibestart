import { motion } from "motion/react";
import type { ReactNode } from "react";

import { ease } from "#/lib/motion.ts";

export const Reveal = ({
  children,
  className,
  delay = 0,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly delay?: number;
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 28 }}
    transition={{ delay, duration: 1, ease }}
    viewport={{ amount: 0.2, once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    {children}
  </motion.div>
);
