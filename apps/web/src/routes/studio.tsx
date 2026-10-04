import { ParaglideMessage } from "@inlang/paraglide-js-react";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { previewName } from "virtual:vibestart";

import { CodeView } from "#/components/code-view.tsx";
import { Command } from "#/components/command.tsx";
import { FileTree } from "#/components/file-tree.tsx";
import type { Choosing } from "#/components/topology/decision.tsx";
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

const Studio = () => {
  const { addons, entry, packageManager, project } = route.useLoaderData();
  const navigate = route.useNavigate();
  const [focus, setFocus] = useState<Focus>(null);
  const [preview, setPreview] = useState<StackEntry | null>(null);
  const [name, setName] = useState(previewName);
  const [openPath, setOpenPath] = useState<string | null>(null);
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
  const previewing = preview !== null && preview.label !== entry.label;
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
          <StackList choosing={choosing} className="lg:hidden" />
          <AnimatePresence>
            {previewing && (
              <motion.span
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card text-muted-foreground shadow-rest absolute top-4 left-6 z-10 hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs lg:flex xl:left-10"
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
            <div className="aspect-[1250/740] min-w-[760px] px-6 py-4 xl:aspect-auto xl:h-full xl:px-10">
              <Topology
                choosing={choosing}
                shown={previewing ? preview.stack : entry.stack}
              />
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

export const Route = createFileRoute("/studio")({
  component: Studio,
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
