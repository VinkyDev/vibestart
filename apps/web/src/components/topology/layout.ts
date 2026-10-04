import type { Stack } from "@vibestart/core";

import type { Group } from "#/lib/roles.ts";
import { chosen } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

export const stage = { height: 740, width: 1250 } as const;

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export const blocks = {
  auth: { height: 148, width: 236, x: 680, y: 372 },
  backend: { height: 232, width: 236, x: 680, y: 90 },
  database: { height: 232, width: 196, x: 1048, y: 90 },
  desktop: { height: 148, width: 252, x: 196, y: 450 },
  framework: { height: 232, width: 252, x: 196, y: 90 },
  visitors: { height: 56, width: 56, x: 28, y: 178 },
} as const satisfies Record<string, Rect>;

export type BlockKind =
  | "framework"
  | "backend"
  | "database"
  | "auth"
  | "desktop";

const folds: Partial<Record<BlockKind, Rect>> = {
  desktop: { height: 64, width: 252, x: 196, y: 460 },
  framework: { height: 64, width: 252, x: 196, y: 254 },
};

export const blockOf = (
  stack: Stack,
  kind: BlockKind
): { readonly rect: Rect; readonly folded: boolean } => {
  const fold = folds[kind];
  return fold !== undefined && stack[kind] === undefined
    ? { folded: true, rect: fold }
    : { folded: false, rect: blocks[kind] };
};

export const rail: Rect = { height: 92, width: 1048, x: 196, y: 632 };

export const placedClass = "absolute top-(--y) left-(--x) h-(--h) w-(--w)";

const boxPadding = 16;
const boxLabel = 30;
const framePadding = 14;
const frameLabel = 22;

const around = (
  rects: readonly Rect[],
  padding: number,
  label: number
): Rect => {
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return {
    height: bottom - top + padding * 2 + label,
    width: right - left + padding * 2,
    x: left - padding,
    y: top - padding - label,
  };
};

export interface ProcessBox {
  readonly id: "web" | "server" | "database" | "desktop";
  readonly rect: Rect;
  readonly label: string;
  readonly group: Group;
  readonly node: boolean;
  readonly deployed: boolean;
}

const has = (stack: Stack, kind: string) => stack[kind] !== undefined;

const webLabel = (
  name: string,
  self: boolean,
  browser: boolean,
  desktop: boolean
): string => {
  if (self) {
    return m.process_with_api({ name });
  }
  if (desktop) {
    return m.runs_in_electron();
  }
  if (browser) {
    return m.runs_in_browser();
  }
  return m.process({ name });
};

export const processBoxes = (stack: Stack): ProcessBox[] => {
  const framework = chosen(stack, "framework");
  const hosted = [
    ...(has(stack, "auth") ? [blocks.auth] : []),
    ...(stack.database === "sqlite" ? [blocks.database] : []),
  ];
  const boxes: ProcessBox[] = [];
  if (framework !== undefined) {
    const self = stack.backend === "self";
    const browser = framework.id === "spa";
    boxes.push({
      deployed: true,
      group: "framework",
      id: "web",
      label: webLabel(framework.name, self, browser, has(stack, "desktop")),
      node: !browser,
      rect: around(
        [blocks.framework, ...(self ? [blocks.backend, ...hosted] : [])],
        boxPadding,
        boxLabel
      ),
    });
  }
  if (stack.backend === "hono") {
    boxes.push({
      deployed: true,
      group: "backend",
      id: "server",
      label: m.hono_process(),
      node: true,
      rect: around([blocks.backend, ...hosted], boxPadding, boxLabel),
    });
  }
  if (stack.database === "postgres") {
    boxes.push({
      deployed: true,
      group: "database",
      id: "database",
      label: m.postgres_process(),
      node: false,
      rect: around([blocks.database], boxPadding, boxLabel),
    });
  }
  if (has(stack, "desktop")) {
    boxes.push({
      deployed: false,
      group: "desktop",
      id: "desktop",
      label: m.electron_process(),
      node: false,
      rect: around([blocks.desktop], boxPadding, boxLabel),
    });
  }
  return boxes;
};

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Edge {
  readonly id: string;
  readonly path: string;
  readonly start: Point;
  readonly end: Point;
  readonly from: Group;
  readonly to: Group;
  readonly ghost: boolean;
}

export const deploymentFrame = (
  boxes: readonly ProcessBox[]
): Point[] | undefined => {
  const deployed = boxes.filter((box) => box.deployed);
  const web = deployed.find((box) => box.id === "web");
  const rest = deployed.filter((box) => box !== web);
  if (deployed.length === 0) {
    return undefined;
  }
  const whole = around(
    deployed.map((box) => box.rect),
    framePadding,
    frameLabel
  );
  const sides = {
    bottom: whole.y + whole.height,
    left: whole.x,
    right: whole.x + whole.width,
    top: whole.y,
  };
  if (web === undefined || rest.length === 0) {
    return [
      { x: sides.left, y: sides.top },
      { x: sides.right, y: sides.top },
      { x: sides.right, y: sides.bottom },
      { x: sides.left, y: sides.bottom },
    ];
  }
  const step = Math.min(...rest.map((box) => box.rect.x)) - framePadding;
  const webBottom = web.rect.y + web.rect.height + framePadding;
  const notch = Math.min(webBottom, sides.bottom);
  return [
    { x: sides.left, y: sides.top },
    { x: sides.right, y: sides.top },
    { x: sides.right, y: sides.bottom },
    { x: step, y: sides.bottom },
    { x: step, y: notch },
    { x: sides.left, y: notch },
  ];
};

export const roundedPath = (points: readonly Point[], radius: number) => {
  const toward = (from: Point, to: Point) => {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    return {
      distance,
      x: distance === 0 ? 0 : (to.x - from.x) / distance,
      y: distance === 0 ? 0 : (to.y - from.y) / distance,
    };
  };
  const corners = points.map((point, index) => {
    const before = points[(index + points.length - 1) % points.length] ?? point;
    const after = points[(index + 1) % points.length] ?? point;
    const back = toward(point, before);
    const forward = toward(point, after);
    const reach = Math.min(radius, back.distance / 2, forward.distance / 2);
    const clockwise = back.x * forward.y - back.y * forward.x < 0 ? 1 : 0;
    return {
      end: { x: point.x + forward.x * reach, y: point.y + forward.y * reach },
      reach,
      start: { x: point.x + back.x * reach, y: point.y + back.y * reach },
      sweep: clockwise,
    };
  });
  return `${corners
    .map(
      ({ end, reach, start, sweep }, index) =>
        `${index === 0 ? "M" : "L"} ${start.x} ${start.y} A ${reach} ${reach} 0 0 ${sweep} ${end.x} ${end.y}`
    )
    .join(" ")} Z`;
};

const right = (rect: Rect): Point => ({
  x: rect.x + rect.width,
  y: rect.y + rect.height / 2,
});
const left = (rect: Rect): Point => ({
  x: rect.x,
  y: rect.y + rect.height / 2,
});
const top = (rect: Rect): Point => ({ x: rect.x + rect.width / 2, y: rect.y });
const bottom = (rect: Rect): Point => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height,
});

const line = (start: Point, end: Point) => ({
  end,
  path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
  start,
});

const curve = (start: Point, c1: Point, c2: Point, end: Point) => ({
  end,
  path: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`,
  start,
});

const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

export const apiAnchor = (stack: Stack): Point =>
  midpoint(
    right(has(stack, "framework") ? blocks.framework : blocks.visitors),
    left(blocks.backend)
  );

const webFloor =
  blocks.framework.y + blocks.framework.height + boxPadding + framePadding;
const shellCeiling = blocks.desktop.y - boxPadding - boxLabel;

export const distAnchor: Point = {
  x: top(blocks.framework).x,
  y: (webFloor + shellCeiling) / 2,
};

const proxyBend =
  (blocks.framework.x +
    blocks.framework.width +
    boxPadding +
    blocks.backend.x -
    boxPadding -
    framePadding) /
  2;

const proxyLanding: Point = {
  x: blocks.backend.x,
  y: blocks.backend.y + 170,
};

const proxyWire = () =>
  curve(
    right(blocks.desktop),
    { x: proxyBend, y: right(blocks.desktop).y },
    { x: proxyBend, y: proxyLanding.y },
    proxyLanding
  );

export const proxyAnchor: Point = {
  x: proxyBend,
  y: midpoint(right(blocks.desktop), proxyLanding).y,
};

export const ormAnchor: Point = midpoint(
  right(blocks.backend),
  left(blocks.database)
);

export const edges = (stack: Stack): Edge[] => {
  const framework = has(stack, "framework");
  const backend = has(stack, "backend");
  const database = has(stack, "database");
  const auth = has(stack, "auth");
  const desktop = has(stack, "desktop");
  const authRight = right(blocks.auth);
  const databaseBottom = bottom(blocks.database);
  const all: (Edge | false)[] = [
    framework && {
      ...line(right(blocks.visitors), left(blocks.framework)),
      from: "foundation",
      ghost: false,
      id: "visitors-framework",
      to: "framework",
    },
    framework && {
      ...line(right(blocks.framework), left(blocks.backend)),
      from: "framework",
      ghost: !backend,
      id: "framework-backend",
      to: "backend",
    },
    desktop && {
      ...line(bottom(blocks.framework), top(blocks.desktop)),
      from: "framework",
      ghost: false,
      id: "framework-desktop",
      to: "desktop",
    },
    desktop && {
      ...proxyWire(),
      from: "desktop",
      ghost: !backend,
      id: "desktop-backend",
      to: "backend",
    },
    !framework && {
      ...line(right(blocks.visitors), left(blocks.backend)),
      from: "foundation",
      ghost: !backend,
      id: "visitors-backend",
      to: "backend",
    },
    {
      ...line(right(blocks.backend), left(blocks.database)),
      from: "backend",
      ghost: !(backend && database),
      id: "backend-database",
      to: "database",
    },
    {
      ...line(bottom(blocks.backend), top(blocks.auth)),
      from: "backend",
      ghost: !(backend && auth),
      id: "backend-auth",
      to: "auth",
    },
    auth &&
      database && {
        ...curve(
          authRight,
          { x: authRight.x + 132, y: authRight.y },
          { x: databaseBottom.x, y: databaseBottom.y + 80 },
          databaseBottom
        ),
        from: "auth",
        ghost: false,
        id: "auth-database",
        to: "database",
      },
  ];
  return all.filter((edge) => edge !== false);
};
