import { ChevronsUpDown, Globe, TerminalSquare } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";

import type { Stack } from "@vibestart/core";
import { cn } from "@vibestart/ui/lib/utils";

import { Block } from "#/components/topology/block.tsx";
import { Capsule, capsuleClass } from "#/components/topology/capsule.tsx";
import { Chip } from "#/components/topology/chip.tsx";
import type { Choosing } from "#/components/topology/decision.tsx";
import { DecisionTrigger } from "#/components/topology/decision.tsx";
import {
  apiAnchor,
  blockOf,
  blocks,
  distAnchor,
  edges,
  ormAnchor,
  placedClass,
  processBoxes,
  proxyAnchor,
  stage,
} from "#/components/topology/layout.ts";
import { Boxes, DeploymentFrame } from "#/components/topology/processes.tsx";
import { Rail } from "#/components/topology/rail.tsx";
import { Wires } from "#/components/topology/wires.tsx";
import { useFocusTarget } from "#/lib/focus.ts";
import { ease, spring } from "#/lib/motion.ts";
import { roles } from "#/lib/roles.ts";
import { chosen, selected } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const useFit = () => {
  const [scale, setScale] = useState(1);
  const ref = useCallback((element: HTMLDivElement | null) => {
    if (element === null) {
      return () => {
        // React already ran the previous element's cleanup.
      };
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) {
        const { height, width } = entry.contentRect;
        setScale(Math.min(width / stage.width, height / stage.height, 1.25));
      }
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
  return { ref, scale };
};

const Visitors = ({ stack }: { readonly stack: Stack }) => {
  const browser = stack.framework !== undefined;
  const Icon = browser ? Globe : TerminalSquare;
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "tint-foundation flex items-center justify-center",
        placedClass
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      style={{
        "--h": `${blocks.visitors.height}px`,
        "--w": `${blocks.visitors.width}px`,
        "--x": `${blocks.visitors.x}px`,
        "--y": `${blocks.visitors.y}px`,
      }}
      transition={{ duration: 0.8, ease }}
    >
      <span className="bg-card shadow-rest relative grid size-14 place-items-center rounded-full">
        <Icon className="text-foreground/70 size-5" strokeWidth={1.5} />
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            animate={{ opacity: 1 }}
            className="text-muted-foreground absolute top-full mt-2 text-xs leading-tight font-medium whitespace-nowrap"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key={String(browser)}
          >
            {browser ? m.visitors() : m.api_clients()}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.div>
  );
};

const Anchored = ({
  children,
  point,
  tint,
}: {
  readonly children: ReactNode;
  readonly point: { readonly x: number; readonly y: number };
  readonly tint?: string;
}) => (
  <motion.div
    animate={{ left: point.x, opacity: 1, top: point.y }}
    className={cn("absolute -translate-x-1/2 -translate-y-1/2", tint)}
    exit={{ opacity: 0 }}
    initial={{ left: point.x, opacity: 0, top: point.y }}
    transition={spring}
  >
    {children}
  </motion.div>
);

const frameworkChips = ["frontend", "router", "ui"] as const;

export const Topology = ({
  choosing,
  shown,
}: {
  readonly choosing: Choosing;
  readonly shown: Stack;
}) => {
  const { ref, scale } = useFit();
  const { enter: enterApi, leave: leaveApi } = useFocusTarget({ group: "api" });
  const boxes = processBoxes(shown);
  const included = selected(shown);
  const chipsOf = (kind: string) => {
    if (kind !== "framework") {
      return [];
    }
    const kinds: readonly string[] = frameworkChips;
    return included.filter((integration) => kinds.includes(integration.kind));
  };
  const api = chosen(shown, "api");
  const orm = chosen(shown, "orm");

  return (
    <div className="relative size-full" ref={ref}>
      <div
        className="absolute top-1/2 left-1/2 h-(--stage-height) w-(--stage-width) origin-center -translate-x-1/2 -translate-y-1/2 scale-(--fit)"
        style={{
          "--fit": scale,
          "--stage-height": `${stage.height}px`,
          "--stage-width": `${stage.width}px`,
        }}
      >
        <DeploymentFrame boxes={boxes} stack={shown} />
        <Boxes boxes={boxes} choosing={choosing} stack={shown} />
        <Wires wires={edges(shown)} />
        <Visitors stack={shown} />
        {(["framework", "desktop", "backend", "database", "auth"] as const).map(
          (kind, index) => {
            const { folded, rect } = blockOf(shown, kind);
            return (
              <Block
                chips={chipsOf(kind)}
                choosing={choosing}
                delay={0.08 * (index + 1)}
                folded={folded}
                key={kind}
                kind={kind}
                rect={rect}
                shown={shown}
              />
            );
          }
        )}
        <AnimatePresence>
          {shown.backend !== undefined && (
            <Anchored key="api" point={apiAnchor(shown)}>
              <div
                className="tint-api"
                onPointerEnter={enterApi}
                onPointerLeave={leaveApi}
              >
                <DecisionTrigger choosing={choosing} className="h-8" kind="api">
                  <span
                    className={cn(
                      capsuleClass,
                      "transition-surface",
                      api === undefined
                        ? "border-foreground/20 bg-background text-muted-foreground hover:text-foreground border border-dashed"
                        : "bg-card text-foreground shadow-rest hover:shadow-lift",
                      shown.api !== choosing.baseline.api && "shadow-preview"
                    )}
                  >
                    <span className="bg-tint size-1.5 rounded-full" />
                    {api === undefined ? (
                      m.add_api()
                    ) : (
                      <>
                        <span className="text-muted-foreground">
                          {roles.api.role}
                        </span>
                        {api.name}
                      </>
                    )}
                    <ChevronsUpDown className="text-muted-foreground size-3" />
                  </span>
                </DecisionTrigger>
              </div>
            </Anchored>
          )}
          {shown.desktop !== undefined && (
            <Anchored key="dist" point={distAnchor} tint="tint-framework">
              <Capsule label={m.desktop_dist()}>
                {m.desktop_dist_pill()}
              </Capsule>
            </Anchored>
          )}
          {shown.desktop !== undefined && shown.backend !== undefined && (
            <Anchored key="proxy" point={proxyAnchor} tint="tint-desktop">
              <Capsule label={m.desktop_proxy()}>
                {m.desktop_proxy_pill()}
              </Capsule>
            </Anchored>
          )}
          {orm !== undefined && (
            <Anchored key="orm" point={ormAnchor} tint="tint-database">
              <Chip integration={orm} label={m.orm()} stack={shown} />
            </Anchored>
          )}
        </AnimatePresence>
        <Rail choosing={choosing} stack={shown} />
      </div>
    </div>
  );
};
