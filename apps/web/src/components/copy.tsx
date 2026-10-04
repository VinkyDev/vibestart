import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { useTimeout } from "#/lib/use-timeout.ts";

const confirmation = 1600;

export const useCopy = () => {
  const [copied, setCopied] = useState(false);
  useTimeout(
    () => {
      setCopied(false);
    },
    copied ? confirmation : undefined
  );

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return { copied, copy };
};

export const CopyGlyph = ({ copied }: { readonly copied: boolean }) => (
  <AnimatePresence initial={false} mode="popLayout">
    <motion.span
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      exit={{ opacity: 0, rotate: -30, scale: 0.6 }}
      initial={{ opacity: 0, rotate: 30, scale: 0.6 }}
      key={String(copied)}
    >
      {copied ? (
        <Check className="text-added size-4" />
      ) : (
        <Copy className="size-4" />
      )}
    </motion.span>
  </AnimatePresence>
);
