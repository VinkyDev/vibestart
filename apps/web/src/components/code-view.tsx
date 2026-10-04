import { range } from "es-toolkit/math";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { Suspense, use, useEffect } from "react";

import type { GeneratedFile } from "@vibestart/core";
import { cn } from "@vibestart/ui/lib/utils";

import { CopyGlyph, useCopy } from "#/components/copy.tsx";
import { tokensOf } from "#/lib/highlight.ts";
import { ease } from "#/lib/motion.ts";
import { groupOf, ownerName, tintClass } from "#/lib/roles.ts";
import { m } from "#/paraglide/messages.js";

/** Italic is the least bit of Shiki's FontStyle, so every italic combination is a positive odd number. */
const italic = (style: number | undefined) =>
  style !== undefined && style > 0 && style % 2 === 1;

const Gutter = ({ count }: { readonly count: number }) => (
  <div
    aria-hidden
    className="text-muted-foreground/50 bg-card sticky left-0 flex flex-col pr-4 pl-5 text-right select-none"
  >
    {range(1, count + 1).map((number) => (
      <span key={number}>{number}</span>
    ))}
  </div>
);

const Highlighted = ({ file }: { readonly file: GeneratedFile }) => {
  const lines = use(tokensOf(file));
  return (
    <div className="flex min-w-max">
      <Gutter count={lines.length} />
      <code className="block pr-8">
        {lines.map((tokens, line) => (
          <span className="block min-h-[1lh]" key={line}>
            {tokens.map((token, index) => (
              <span
                className={italic(token.fontStyle) ? "italic" : undefined}
                key={index}
                style={{ color: token.color }}
              >
                {token.content}
              </span>
            ))}
          </span>
        ))}
      </code>
    </div>
  );
};

const Plain = ({ file }: { readonly file: GeneratedFile }) => {
  const lines = file.content.split("\n");
  return (
    <div className="text-foreground/70 flex min-w-max">
      <Gutter count={lines.length} />
      <code className="block pr-8 whitespace-pre">{file.content}</code>
    </div>
  );
};

export const CodeView = ({
  file,
  onClose,
}: {
  readonly file: GeneratedFile;
  readonly onClose: () => void;
}) => {
  const { copied, copy } = useCopy();
  const directories = file.path.split("/");
  const name = directories.pop();

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
    };
  }, [onClose]);

  return (
    <motion.aside
      animate={{ filter: "blur(0px)", opacity: 1, x: 0 }}
      aria-label={file.path}
      className={cn(
        tintClass[groupOf(file.owner)],
        "bg-card shadow-pop lg:rounded-sheet fixed inset-0 z-50 flex flex-col overflow-hidden lg:absolute lg:inset-y-2 lg:right-3 lg:left-auto lg:z-30 lg:w-[min(820px,calc(100%-24px))]"
      )}
      exit={{ filter: "blur(6px)", opacity: 0, x: 40 }}
      initial={{ filter: "blur(6px)", opacity: 0, x: 40 }}
      transition={{ duration: 0.45, ease }}
    >
      <header className="border-border flex items-center gap-3 border-b px-4 py-3 lg:px-5 lg:py-3.5">
        <span className="flex min-w-0 flex-1 items-center text-sm">
          <span className="text-muted-foreground min-w-0 truncate">
            {directories.map((segment, index) => (
              <span key={`${index}-${segment}`}>
                {segment}
                <span className="text-muted-foreground/50 px-1.5">/</span>
              </span>
            ))}
          </span>
          <span className="text-foreground max-w-full shrink-0 truncate font-medium">
            {name}
          </span>
        </span>
        <span className="text-tint bg-tint-soft flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
          <span className="bg-tint size-1.5 rounded-full" />
          {ownerName(file.owner)}
        </span>
        <button
          aria-label={m.copy_file()}
          className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 grid size-8 place-items-center rounded-lg transition-colors"
          onClick={() => {
            void copy(file.content);
          }}
          type="button"
        >
          <CopyGlyph copied={copied} />
        </button>
        <button
          aria-label={m.close_file()}
          className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 grid size-8 place-items-center rounded-lg transition-colors"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
      </header>
      <div className="leading-code text-snippet min-h-0 flex-1 overflow-auto overscroll-contain py-4 font-mono whitespace-pre">
        <Suspense fallback={<Plain file={file} />}>
          <Highlighted file={file} />
        </Suspense>
      </div>
    </motion.aside>
  );
};
