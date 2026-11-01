import { ParaglideMessage } from "@inlang/paraglide-js-react";
import {
  createFileRoute,
  getRouteApi,
  Link,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { ArrowUpRight, CircleHelp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode, RefObject } from "react";
import { useRef, useState } from "react";
import { previewName } from "virtual:vibestart";

import { Button, buttonVariants } from "@vibestart/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@vibestart/ui/components/popover";

import { CodeView } from "#/components/code-view.tsx";
import { Command } from "#/components/command.tsx";
import { AgentHandoff } from "#/components/create-agent.tsx";
import { FileTree } from "#/components/file-tree.tsx";
import { Segmented } from "#/components/segmented.tsx";
import type { Choosing } from "#/components/topology/decision.tsx";
import { layoutOf, stageWidth } from "#/components/topology/layout.ts";
import { StackList } from "#/components/topology/stack-list.tsx";
import { Topology } from "#/components/topology/topology.tsx";
import type { Focus } from "#/lib/focus.ts";
import { FocusContext } from "#/lib/focus.ts";
import type { StackEntry } from "#/lib/project.ts";
import type { FileDelta } from "#/lib/projects.ts";
import { fileDelta, loadProject } from "#/lib/projects.ts";
import {
  addonsFlag,
  entryFromFlags,
  flagsOf,
  parseAddons,
  parseFlags,
  searchSchema,
} from "#/lib/stack.ts";
import type { Search } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const route = getRouteApi("/studio");

const previewingMarkup = {
  stack: ({ children }: { readonly children?: ReactNode }) => (
    <span className="text-foreground font-medium">{children}</span>
  ),
};

const ModeGuide = ({
  anchor,
  mode,
}: {
  readonly anchor: RefObject<HTMLDivElement | null>;
  readonly mode: "standard" | "effect";
}) => (
  <Popover>
    <PopoverTrigger
      aria-label={m.mode_guide_trigger()}
      className="group/mode"
      closeDelay={120}
      delay={180}
      openOnHover
    >
      <span className="text-muted-foreground group-hover/mode:text-foreground group-data-popup-open/mode:text-foreground group-focus-visible/mode:focus-ring inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors">
        <span aria-live="polite" className="hidden sm:inline">
          {mode === "effect" ? m.mode_effect_about() : m.mode_standard_about()}
        </span>
        <CircleHelp className="size-3.5 shrink-0" strokeWidth={1.75} />
      </span>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      anchor={anchor}
      className="w-80"
      sideOffset={8}
    >
      <div className="flex flex-col gap-3 p-2.5 text-xs leading-relaxed">
        <div>
          <PopoverTitle>{m.mode_guide_title()}</PopoverTitle>
          <div className="mt-1">
            <PopoverDescription>{m.mode_guide_intro()}</PopoverDescription>
          </div>
        </div>
        <div className="grid gap-2">
          <div className="bg-foreground/[0.04] rounded-xl p-2.5">
            <p className="text-foreground font-medium">
              {m.mode_guide_effect_title()}
            </p>
            <p className="text-muted-foreground mt-0.5">
              {m.mode_guide_effect_body()}
            </p>
          </div>
          <div className="bg-foreground/[0.04] rounded-xl p-2.5">
            <p className="text-foreground font-medium">
              {m.mode_guide_standard_title()}
            </p>
            <p className="text-muted-foreground mt-0.5">
              {m.mode_guide_standard_body()}
            </p>
          </div>
        </div>
        <Link
          className="text-foreground/80 hover:text-foreground focus-visible:focus-ring inline-flex items-center gap-1 self-start rounded-sm font-medium transition-colors outline-none"
          params={{ _splat: "stack/effect" }}
          to="/docs/$"
        >
          {m.mode_guide_docs()}
          <ArrowUpRight className="size-3.5" strokeWidth={1.75} />
        </Link>
      </div>
    </PopoverContent>
  </Popover>
);

const Studio = () => {
  const { addons, entry, packageManager, project } = route.useLoaderData();
  const navigate = route.useNavigate();
  const [focus, setFocus] = useState<Focus>(null);
  const [preview, setPreview] = useState<StackEntry | null>(null);
  const [name, setName] = useState(previewName);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const modeRef = useRef<HTMLDivElement>(null);

  const [tracked, setTracked] = useState<{
    readonly delta: FileDelta | undefined;
    readonly project: typeof project;
    readonly version: number;
  }>({ delta: undefined, project, version: 0 });

  if (tracked.project !== project) {
    setTracked({
      delta: fileDelta(tracked.project, project),
      project,
      version: tracked.version + 1,
    });
  }

  const file = project.files.find((candidate) => candidate.path === openPath);

  const previewing =
    preview !== null &&
    preview.stack.mode === entry.stack.mode &&
    preview.label !== entry.label;

  const shown = previewing ? preview.stack : entry.stack;

  const choosing: Choosing = {
    baseline: entry.stack,
    addons,
    onAddons: (next) => {
      void navigate({
        resetScroll: false,
        search: (previous) => ({
          ...previous,
          addons: addonsFlag(next),
        }),
      });
    },
    onChoose: (next) => {
      void navigate({
        resetScroll: false,
        search: (previous) => ({
          ...flagsOf(next.stack),
          addons: previous.addons,
          packageManager: previous.packageManager,
        }),
      });
    },
    onPreview: setPreview,
    project,
  };

  return (
    <FocusContext value={{ focus, setFocus }}>
      {/* Below the root's app bar. Once the map fits beside the panel at a readable scale, the page fills
          the rest of the viewport and scrolls within its panes; until then the map takes the full width
          at its own proportions, above the panel. Too narrow to read the map, the stack is a list, which stays
          beside the panel while it scrolls once both fit. */}
      <main className="grid flex-1 items-start gap-3 px-3 pb-3 md:grid-cols-2 lg:grid-cols-1 lg:items-stretch xl:h-[calc(100svh-var(--spacing-header))] xl:flex-none xl:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] xl:pl-0">
        <section className="md:max-lg:tall:top-header md:max-lg:tall:sticky relative flex min-h-0 flex-col lg:overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 lg:pl-6 xl:pl-10">
            <div className="flex flex-wrap items-center gap-2" ref={modeRef}>
              <Segmented
                id="studio-mode"
                label={m.kind_mode()}
                options={[
                  { value: "standard", label: m.mode_standard() },
                  { value: "effect", label: "Effect" },
                ]}
                value={entry.stack.mode ?? "standard"}
                onChange={(mode) => {
                  setPreview(null);
                  setFocus(null);
                  setOpenPath(null);
                  void navigate({
                    resetScroll: false,
                    search: (previous) => ({
                      mode: mode === "effect" ? "effect" : undefined,
                      addons: previous.addons,
                      packageManager: previous.packageManager,
                    }),
                  });
                }}
              />
              <ModeGuide
                anchor={modeRef}
                mode={entry.stack.mode === "effect" ? "effect" : "standard"}
              />
            </div>
            <AgentHandoff />
          </div>
          <StackList choosing={choosing} className="lg:hidden" />
          <AnimatePresence>
            {previewing && (
              <motion.span
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card text-muted-foreground shadow-rest absolute top-16 left-6 z-10 hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs lg:flex xl:left-10"
                exit={{ opacity: 0, scale: 0.96 }}
                initial={{ opacity: 0, scale: 0.96 }}
              >
                <span className="bg-changed size-1.5 animate-pulse rounded-full" />
                <span>
                  <ParaglideMessage
                    inputs={{ label: preview.label }}
                    markup={previewingMarkup}
                    message={m.previewing}
                  />
                </span>
              </motion.span>
            )}
          </AnimatePresence>
          <div className="relative hidden min-h-[440px] overflow-x-auto overflow-y-hidden lg:block xl:flex-1">
            <div
              className="aspect-(--stage-ratio) min-w-[760px] px-6 py-4 xl:aspect-auto xl:h-full xl:px-10"
              style={{
                "--stage-ratio": `${stageWidth} / ${layoutOf(shown).height}`,
              }}
            >
              <Topology choosing={choosing} shown={shown} />
            </div>
          </div>
          <AnimatePresence>
            {file !== undefined && (
              <CodeView
                file={file}
                key="code"
                onClose={() => {
                  setOpenPath(null);
                }}
              />
            )}
          </AnimatePresence>
        </section>
        <aside className="bg-card shadow-sheet rounded-sheet flex flex-col overflow-hidden lg:h-[720px] xl:h-auto xl:min-h-0">
          <Command
            packageManager={packageManager}
            onPackageManager={(next) => {
              void navigate({
                resetScroll: false,
                search: (previous) => ({
                  ...previous,
                  packageManager: next === "pnpm" ? undefined : next,
                }),
              });
            }}
            addons={addons}
            entry={entry}
            name={name}
            onName={setName}
            project={project}
          />
          <FileTree
            delta={tracked.delta}
            deltaVersion={tracked.version}
            name={name}
            onOpen={setOpenPath}
            openPath={openPath}
            project={project}
          />
        </aside>
      </main>
    </FocusContext>
  );
};

const StudioError = () => {
  const router = useRouter();
  const loading = useRouterState({ select: (state) => state.isLoading });

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <section
        className="grid max-w-lg justify-items-center gap-6 text-center"
        role="alert"
      >
        <h1 className="font-headline text-section text-balance">
          {m.preview_error_title()}
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed text-pretty">
          {m.preview_error_body()}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            disabled={loading}
            onClick={() => {
              void router.invalidate();
            }}
            size="lg"
          >
            {m.preview_retry()}
          </Button>
          <Link
            className={buttonVariants({ size: "lg", variant: "outline" })}
            to="/"
          >
            {m.not_found_home()}
          </Link>
        </div>
      </section>
    </main>
  );
};

export const Route = createFileRoute("/studio")({
  component: Studio,
  errorComponent: StudioError,
  loader: async ({ deps }) => {
    const entry = entryFromFlags(deps.flags);

    return {
      addons: deps.addons,
      entry,
      project: await loadProject(entry, deps.addons, deps.packageManager),
      packageManager: deps.packageManager,
    };
  },
  loaderDeps: ({ search }: { readonly search: Search }) => ({
    addons: parseAddons(search.addons),
    flags: parseFlags(search),
    packageManager: search.packageManager ?? "pnpm",
  }),
  validateSearch: searchSchema,
});
