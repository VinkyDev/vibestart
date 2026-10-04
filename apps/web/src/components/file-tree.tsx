import { range } from "es-toolkit/math";
import {
  Braces,
  ChevronRight,
  Container,
  Database,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  Settings2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import { focusesOwner, useFocus } from "#/lib/focus.ts";
import type { Project } from "#/lib/project.ts";
import type { FileDelta, TreeNode } from "#/lib/projects.ts";
import { fileTree } from "#/lib/projects.ts";
import { groupOf, ownerName, tintClass } from "#/lib/roles.ts";
import { m } from "#/paraglide/messages.js";

const iconOf = (name: string) => {
  if (name === "Dockerfile" || name.startsWith("docker-compose")) {
    return Container;
  }
  if (name.endsWith(".sql")) {
    return Database;
  }
  if (name.endsWith(".json") || name.endsWith(".jsonc")) {
    return Braces;
  }
  if (name.endsWith(".md")) {
    return FileText;
  }
  if (/\.(?:tsx?|css|html)$/u.test(name)) {
    return FileCode2;
  }
  return Settings2;
};

interface Row {
  readonly node: TreeNode;
  readonly depth: number;
}

const openRoots = new Set(["apps", "packages"]);

const rowsOf = (
  nodes: readonly TreeNode[],
  collapsed: (path: string) => boolean,
  depth = 0
): Row[] =>
  nodes.flatMap((node) => [
    { depth, node },
    ...(node.type === "directory" && !collapsed(node.path)
      ? rowsOf(node.children, collapsed, depth + 1)
      : []),
  ]);

const ownersUnder = (node: TreeNode): string[] =>
  node.type === "file"
    ? [node.file.owner]
    : node.children.flatMap((child) => ownersUnder(child));

const rowHeight = 30;

export const FileTree = ({
  delta,
  deltaVersion,
  name,
  onOpen,
  openPath,
  project,
}: {
  readonly delta: FileDelta | undefined;
  readonly deltaVersion: number;
  readonly name: string;
  readonly onOpen: (path: string | null) => void;
  readonly openPath: string | null;
  readonly project: Project;
}) => {
  const { focus, setFocus } = useFocus();
  const [toggled, setToggled] = useState<ReadonlySet<string>>(new Set());
  const collapsed = (path: string) => openRoots.has(path) === toggled.has(path);
  const rows = rowsOf(fileTree(project.files), collapsed);
  const removed = new Set(delta?.removed.map((file) => file.path));

  const toggle = (path: string) => {
    setToggled((current) => {
      const next = new Set(current);
      if (!next.delete(path)) {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <section className="border-foreground/[0.07] flex min-h-0 flex-1 flex-col border-t">
      <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
        <span className="text-foreground flex items-center gap-2 text-sm font-medium">
          <FolderOpen
            className="text-muted-foreground size-4"
            strokeWidth={1.75}
          />
          {name}
        </span>
        <span className="text-muted-foreground flex items-center gap-2.5 text-xs tabular-nums">
          {delta !== undefined && (
            <span className="flex gap-1.5 font-medium" key={deltaVersion}>
              {delta.added.size > 0 && (
                <span className="text-added">+{delta.added.size}</span>
              )}
              {delta.removed.length > 0 && (
                <span className="text-removed">−{delta.removed.length}</span>
              )}
              {delta.changed.size > 0 && (
                <span className="text-changed">~{delta.changed.size}</span>
              )}
            </span>
          )}
          {m.file_count({ count: project.files.length })}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <AnimatePresence custom={removed} initial={false}>
          {rows.map(({ depth, node }) => {
            const owners = ownersUnder(node);
            let lit: boolean | undefined;
            if (focus !== null) {
              lit = owners.some((owner) => focusesOwner(focus, owner));
            }
            const added = delta?.added.has(node.path) === true;
            const changed = delta?.changed.has(node.path) === true;
            let Icon = iconOf(node.name);
            if (node.type === "directory") {
              Icon = collapsed(node.path) ? Folder : FolderOpen;
            }
            return (
              <motion.button
                animate={{
                  height: rowHeight,
                  opacity: lit === false ? 0.32 : 1,
                }}
                className={cn(
                  node.type === "file" && tintClass[groupOf(node.file.owner)],
                  "tree-row group/row hover:bg-foreground/[0.045] focus-visible:bg-foreground/[0.06] text-snippet relative flex w-full shrink-0 items-center gap-1.5 overflow-hidden rounded-lg pr-2 text-left outline-none",
                  node.path === openPath &&
                    "bg-foreground/[0.07] hover:bg-foreground/[0.07]"
                )}
                custom={removed}
                exit="exit"
                initial={{ height: 0, opacity: 0 }}
                key={node.path}
                onClick={() => {
                  if (node.type === "directory") {
                    toggle(node.path);
                    return;
                  }
                  onOpen(node.path === openPath ? null : node.path);
                }}
                onPointerEnter={() => {
                  if (node.type === "file") {
                    setFocus({ owner: node.file.owner });
                  }
                }}
                onPointerLeave={() => {
                  setFocus(null);
                }}
                style={{ "--depth": depth }}
                transition={{ duration: 0.3 }}
                type="button"
                variants={{
                  exit: (paths: ReadonlySet<string>) => ({
                    backgroundColor: paths.has(node.path)
                      ? "rgba(214, 69, 65, 0.14)"
                      : "rgba(0, 0, 0, 0)",
                    height: 0,
                    opacity: 0,
                  }),
                }}
              >
                {(added || changed) && (
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-lg",
                      added ? "animate-added" : "animate-changed"
                    )}
                    key={deltaVersion}
                  />
                )}
                {range(depth).map((level) => (
                  <span
                    className="tree-guide bg-foreground/[0.07] absolute top-0 bottom-0 w-px"
                    key={level}
                    style={{ "--level": level }}
                  />
                ))}
                {node.type === "directory" ? (
                  <ChevronRight
                    className={cn(
                      "text-muted-foreground/60 size-3 shrink-0 transition-transform",
                      !collapsed(node.path) && "rotate-90"
                    )}
                  />
                ) : (
                  <span className="size-3 shrink-0" />
                )}
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    node.type === "file" ? "text-tint" : "text-muted-foreground"
                  )}
                  strokeWidth={1.75}
                />
                <span
                  className={cn(
                    "truncate",
                    node.type === "directory"
                      ? "text-foreground font-medium"
                      : "text-foreground/80"
                  )}
                >
                  {node.name}
                </span>
                {node.type === "file" && (
                  <span className="ml-auto flex shrink-0 items-center gap-1.5 pl-2">
                    <span className="text-muted-foreground hidden text-xs group-hover/row:inline">
                      {ownerName(node.file.owner)}
                    </span>
                    {added && <span className="text-added text-xs">+</span>}
                    {changed && <span className="text-changed text-xs">~</span>}
                  </span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
};
