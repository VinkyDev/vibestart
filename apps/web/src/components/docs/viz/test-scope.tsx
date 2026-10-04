import { useState } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import { Demo } from "#/components/demo/frame.tsx";
import type { Place } from "#/components/docs/viz/journey.tsx";
import { places } from "#/components/docs/viz/journey.tsx";
import { m } from "#/paraglide/messages.js";

const row: readonly Place[] = ["user", "browser", "server", "database"];

const layers = [
  {
    example:
      "a new user signs up and manages todos that persist across reloads",
    id: "e2e",
    label: () => m.viz_test_e2e(),
    pace: "~ 3 s",
    span: "col-span-4 col-start-1",
    tool: "Playwright",
  },
  {
    example: "keeps each user's todos private",
    id: "integration",
    label: () => m.viz_test_integration(),
    pace: "~ 50 ms",
    span: "col-span-2 col-start-3",
    tool: "Vitest",
  },
  {
    example: "a discount never takes a total below zero",
    id: "unit",
    label: () => m.viz_test_unit(),
    pace: "~ 1 ms",
    span: "col-span-1 col-start-3",
    tool: "Vitest",
  },
] as const;

type Layer = (typeof layers)[number]["id"];

export const TestScope = ({
  text,
}: {
  readonly text: Readonly<Record<Layer, string>>;
}) => {
  const [chosen, setChosen] = useState<Layer>("e2e");
  const layer =
    layers.find((candidate) => candidate.id === chosen) ?? layers[0];

  return (
    <div className="my-8">
      <Demo
        actions={null}
        caption={text[chosen]}
        status={
          <div className="flex min-h-6 items-center justify-between gap-4">
            <code className="text-foreground/80 min-w-0 truncate font-mono text-xs">
              {layer.example}
            </code>
            <span className="text-muted-foreground shrink-0 font-mono text-xs">
              {layer.tool}
            </span>
          </div>
        }
      >
        <ol className="grid grid-cols-4 gap-2">
          {row.map((place) => {
            const { icon: Icon, label, tint } = places[place];
            return (
              <li
                className={cn(tint, "flex flex-col items-center gap-1.5")}
                key={place}
              >
                <span className="bg-card shadow-rest text-tint grid size-9 place-items-center rounded-xl">
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <span className="text-muted-foreground text-fine text-center leading-tight">
                  {label()}
                </span>
              </li>
            );
          })}
        </ol>
        <ul className="relative flex flex-col gap-2">
          {/* The columns' guides, so each bar reads against the places above it. */}
          <li
            aria-hidden
            className="pointer-events-none absolute inset-0 grid grid-cols-4 gap-2"
          >
            {row.map((place) => (
              <span
                className="border-border mx-auto h-full border-l border-dashed"
                key={place}
              />
            ))}
          </li>
          {layers.map((candidate) => {
            const on = candidate.id === chosen;
            return (
              <li
                className="relative grid grid-cols-4 gap-2"
                key={candidate.id}
              >
                <button
                  className={cn(
                    candidate.span,
                    "flex h-11 min-w-0 items-center justify-between gap-2 rounded-xl px-2 text-left transition duration-300 sm:px-3",
                    on
                      ? "bg-foreground text-background shadow-preview"
                      : "bg-card text-muted-foreground shadow-rest hover:text-foreground"
                  )}
                  onClick={() => {
                    setChosen(candidate.id);
                  }}
                  type="button"
                >
                  <span className="text-fine truncate font-medium sm:text-xs">
                    {candidate.label()}
                  </span>
                  <span
                    className={cn(
                      "text-micro hidden shrink-0 font-mono sm:inline",
                      on ? "text-background/70" : "text-muted-foreground"
                    )}
                  >
                    {candidate.pace}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Demo>
    </div>
  );
};
