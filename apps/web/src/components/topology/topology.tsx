import { ChevronsUpDown, Globe, TerminalSquare } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";

import type { Stack } from "@vibestart/core";
import { cn } from "@vibestart/ui/lib/utils";

import { Block } from "#/components/topology/block.tsx";
import { Capsule, capsuleClass } from "#/components/topology/capsule.tsx";
import type { Choosing } from "#/components/topology/decision.tsx";
import { DecisionTrigger } from "#/components/topology/decision.tsx";
import {
  apiAnchor,
  blocks,
  distAnchor,
  edges,
  layoutOf,
  ormAnchor,
  placedClass,
  processBoxes,
  stageWidth,
} from "#/components/topology/layout.ts";
import { Boxes, DeploymentFrame } from "#/components/topology/processes.tsx";
import { Rail } from "#/components/topology/rail.tsx";
import { Wires } from "#/components/topology/wires.tsx";
import { useFocusTarget } from "#/lib/focus.ts";
import { ease, spring } from "#/lib/motion.ts";
import { roles } from "#/lib/roles.ts";
import { chosen, selected } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const useFit = (stageHeight: number) => {
  // `settled` once measured before: the first fit is not an animation.
  const [room, setRoom] = useState<{
    readonly width: number;
    readonly height: number;
    readonly settled: boolean;
  }>();

  const ref = useCallback((element: HTMLDivElement | null) => {
    if (element === null) {
      return () => {
        // React already ran the previous element's cleanup.
      };
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) {
        const { height, width } = entry.contentRect;
        setRoom((previous) => ({
          height,
          settled: previous !== undefined,
          width,
        }));
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const scale =
    room === undefined
      ? 1
      : Math.min(room.width / stageWidth, room.height / stageHeight, 1.25);

  return { ref, scale, settled: room?.settled === true };
};

const ApiClients = ({ stack }: { readonly stack: Stack }) =>
  (stack.desktop !== undefined || stack.mobile !== undefined) && (
    <>
      <p>{m.api_clients_same()}</p>
      {stack.desktop !== undefined && <p>{m.api_client_desktop()}</p>}
      {stack.mobile !== undefined && <p>{m.api_client_mobile()}</p>}
    </>
  );

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
  const layout = layoutOf(shown);
  const { ref, scale, settled } = useFit(layout.height);
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
      {/* The stage grows with the clients it shows, and stays centered as it does. */}
      <motion.div
        animate={{ height: layout.height, scale, x: "-50%", y: "-50%" }}
        className="absolute top-1/2 left-1/2 w-(--stage-width) origin-center"
        initial={false}
        style={{ "--stage-width": `${stageWidth}px` }}
        transition={settled ? spring : { duration: 0 }}
      >
        <DeploymentFrame boxes={boxes} stack={shown} />
        <Boxes boxes={boxes} choosing={choosing} stack={shown} />
        <Wires wires={edges(shown)} />
        {/* A mobile app alone serves no page and no API to anyone else. */}
        {(shown.framework !== undefined || shown.backend !== undefined) && (
          <Visitors stack={shown} />
        )}
        {(
          [
            "framework",
            "desktop",
            "backend",
            "database",
            "auth",
            "mobile",
          ] as const
        ).map((kind, index) => {
          const { folded, rect } = layout.blocks[kind];

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
        })}
        <AnimatePresence>
          {shown.backend !== undefined && (
            <Anchored key="api" point={apiAnchor}>
              <div
                className="tint-api"
                onPointerEnter={enterApi}
                onPointerLeave={leaveApi}
              >
                <DecisionTrigger
                  choosing={choosing}
                  className="h-8"
                  details={<ApiClients stack={choosing.baseline} />}
                  kind="api"
                >
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
            <Anchored
              key="dist"
              point={distAnchor(shown)}
              tint="tint-framework"
            >
              <Capsule label={m.desktop_dist()}>
                {m.desktop_dist_pill()}
              </Capsule>
            </Anchored>
          )}
          {orm !== undefined && (
            <Anchored key="orm" point={ormAnchor} tint="tint-database">
              <DecisionTrigger choosing={choosing} kind="orm">
                <span
                  className={cn(
                    capsuleClass,
                    "bg-card text-foreground shadow-rest hover:bg-tint-soft focus-visible:focus-ring transition-colors",
                    shown.orm !== choosing.baseline.orm && "shadow-preview"
                  )}
                >
                  <span className="bg-tint size-1.5 rounded-full" />
                  <span className="text-muted-foreground">{m.orm()}</span>
                  {orm.name}
                  <ChevronsUpDown className="size-3" />
                </span>
              </DecisionTrigger>
            </Anchored>
          )}
        </AnimatePresence>
        <Rail choosing={choosing} rect={layout.rail} stack={shown} />
      </motion.div>
    </div>
  );
};
