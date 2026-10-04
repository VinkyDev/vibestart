import { Tabs } from "@base-ui/react/tabs";
import { motion } from "motion/react";

import { cn } from "@vibestart/ui/lib/utils";

import { ChangeDemo } from "#/components/home/demo/change-demo.tsx";
import type { Scenario } from "#/components/home/demo/change-demo.tsx";
import { Reveal } from "#/components/home/reveal.tsx";
import { ease } from "#/lib/motion.ts";
import type { Group } from "#/lib/roles.ts";
import { tintClass } from "#/lib/roles.ts";
import { m } from "#/paraglide/messages.js";

const pillars: readonly {
  readonly body: () => string;
  readonly id: Scenario;
  readonly tint: Group;
  readonly title: () => string;
  readonly tools: readonly string[];
}[] = [
  {
    body: () => m.pillar_types_body(),
    id: "types",
    tint: "framework",
    title: () => m.pillar_types_title(),
    tools: ["TypeScript", "Drizzle", "Zod", "oRPC"],
  },
  {
    body: () => m.pillar_tests_body(),
    id: "tests",
    tint: "api",
    title: () => m.pillar_tests_title(),
    tools: ["Vitest", "Playwright"],
  },
  {
    body: () => m.pillar_quality_body(),
    id: "quality",
    tint: "backend",
    title: () => m.pillar_quality_title(),
    tools: ["Oxlint", "Oxfmt", "Ultracite", "Knip", "AGENTS.md"],
  },
];

export const Baseline = () => (
  <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 pt-28 sm:gap-14 lg:pt-44">
    <Reveal className="flex max-w-2xl flex-col gap-6">
      <h2 className="font-headline text-section text-balance whitespace-pre-line">
        {m.home_base_title()}
      </h2>
      <p className="text-muted-foreground text-base leading-relaxed text-pretty">
        {m.home_base_body()}
      </p>
    </Reveal>

    <Reveal delay={0.1}>
      <Tabs.Root
        className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14"
        defaultValue="types"
        orientation="vertical"
      >
        <Tabs.List className="border-border flex flex-col border-t lg:self-start">
          {pillars.map(({ body, id, tint, title, tools }) => (
            <Tabs.Tab
              className={cn(
                tintClass[tint],
                "group border-border focus-visible:focus-ring relative flex flex-col border-b py-6 pl-6 text-left outline-none"
              )}
              key={id}
              value={id}
            >
              <span className="bg-tint absolute inset-y-6 left-0 w-0.5 origin-top scale-y-0 rounded-full transition-transform duration-500 group-data-active:scale-y-100" />
              <span className="font-headline text-muted-foreground group-hover:text-foreground group-data-active:text-foreground text-2xl leading-tight transition-colors sm:text-3xl">
                {title()}
              </span>
              <span className="transition-rows grid grid-rows-[0fr] duration-500 ease-out group-data-active:grid-rows-[1fr]">
                <span className="flex min-h-0 flex-col gap-4 overflow-hidden">
                  <span className="text-muted-foreground pt-3 text-sm leading-relaxed text-pretty">
                    {body()}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5 pb-0.5">
                    <span className="text-muted-foreground mr-1 text-xs">
                      {m.home_built_on()}
                    </span>
                    {tools.map((tool) => (
                      <span
                        className="bg-tint-soft text-foreground/80 text-fine rounded-full px-2.5 py-0.5 font-mono"
                        key={tool}
                      >
                        {tool}
                      </span>
                    ))}
                  </span>
                </span>
              </span>
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {pillars.map(({ id }) => (
          <Tabs.Panel
            className="rounded-sheet focus-visible:ring-foreground/30 min-w-0 outline-none focus-visible:ring-2"
            key={id}
            value={id}
          >
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.5, ease }}
            >
              <ChangeDemo key={id} scenario={id} />
            </motion.div>
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </Reveal>
  </section>
);
