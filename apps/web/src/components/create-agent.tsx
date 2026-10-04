import type { Stack } from "@vibestart/core";

import { CopyGlyph, useCopy } from "#/components/copy.tsx";
import { repository } from "#/lib/site.ts";
import { commandLine, decisions } from "#/lib/stack.ts";
import type { commandWords } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

/** Explicit choices keep the handoff independent of the CLI release's defaults. */
export const CreateAgent = ({
  words,
  stack,
  addons,
  packageManager,
  name,
  onName,
  invalid,
}: {
  readonly stack: Stack;
  readonly words: ReturnType<typeof commandWords>;
  readonly addons: readonly string[];
  readonly packageManager: "pnpm" | "bun";
  readonly name: string;
  readonly onName: (name: string) => void;
  readonly invalid: boolean;
}) => {
  const { copied, copy } = useCopy();
  const command = commandLine({
    ...words,
    flags: [
      ...decisions.map((kind) => ({ kind, value: stack[kind] ?? "none" })),
      { kind: "package-manager", value: packageManager },
      { kind: "addons", value: addons.join(",") || "none" },
    ],
  });
  const prompt = m.create_agent_prompt({
    command: `${command} --json`,
    skill: `npx skills use "${repository}" --skill "vibestart"`,
  });

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-muted-foreground text-xs leading-relaxed">
        {m.create_agent_hint()}
      </p>
      <label className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground shrink-0">
          {m.project_name()}
        </span>
        <input
          aria-invalid={invalid}
          className="border-border bg-foreground/[0.04] focus-visible:ring-foreground/30 aria-invalid:border-removed min-w-0 flex-1 rounded-lg border px-3 py-2 font-mono outline-none focus-visible:ring-2"
          onChange={(event) => {
            onName(event.target.value);
          }}
          spellCheck={false}
          value={name}
        />
      </label>
      <textarea
        aria-label={m.create_agent_preview()}
        className="bg-foreground/[0.04] text-muted-foreground focus-visible:ring-foreground/30 max-h-64 w-full resize-none rounded-xl p-3 text-xs leading-relaxed outline-none focus-visible:ring-2"
        readOnly
        rows={7}
        value={prompt}
      />
      <button
        className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground/30 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 disabled:opacity-40"
        disabled={invalid}
        onClick={() => {
          void copy(prompt);
        }}
        type="button"
      >
        <CopyGlyph copied={copied} />
        <span aria-live="polite">
          {copied ? m.create_agent_copied() : m.create_agent_copy()}
        </span>
      </button>
    </div>
  );
};
