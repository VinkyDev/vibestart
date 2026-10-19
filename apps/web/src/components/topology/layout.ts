import type { Stack } from "@vibestart/core";

import type { Group } from "#/lib/roles.ts";
import { chosen } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

export const stageWidth = 1250;

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export const blocks = {
  auth: { height: 148, width: 220, x: 650, y: 372 },
  backend: { height: 232, width: 220, x: 650, y: 90 },
  // Room between the server and the database for the ORM capsule, the widest on the stage.
  database: { height: 232, width: 184, x: 1060, y: 90 },
  framework: { height: 232, width: 252, x: 196, y: 90 },
  visitors: { height: 56, width: 56, x: 28, y: 178 },
} as const satisfies Record<string, Rect>;

/** The apps beside the web app that call the same API: they stack under it, in the column of clients. */
const clients = ["desktop", "mobile"] as const;

type Client = (typeof clients)[number];

type BlockKind = "framework" | "backend" | "database" | "auth" | Client;

interface Placed {
  readonly rect: Rect;
  readonly folded: boolean;
}

const boxPadding = 16;
const boxLabel = 30;
const framePadding = 14;
const frameLabel = 22;

const frameworkFold: Rect = { height: 64, width: 252, x: 196, y: 254 };
const clientHeight = 148;
const foldHeight = 56;

// Room between the web app and the desktop shell for the capsule naming what the shell loads.
const shellGap = 66;
const clientGap = 32;
const foldGap = 12;

// The server column ends with the deployment frame around the server and its auth.
const serverFloor =
  blocks.auth.y + blocks.auth.height + boxPadding + framePadding;

const railGap = 48;
const railHeight = 92;

export interface Layout {
  readonly blocks: Record<BlockKind, Placed>;
  readonly rail: Rect;
  readonly height: number;
}

// A framework that serves the API itself shares its process box with the server and auth.
const webBoxBlocks = (stack: Stack): Rect[] => [
  blocks.framework,
  ...(stack.backend === "self"
    ? [blocks.backend, ...(stack.auth === undefined ? [] : [blocks.auth])]
    : []),
];

/**
 * Where everything sits for `stack`. The clients take room only when chosen: a chosen client gets a block in
 * its process box, and the others fold into a row each beneath, so the stage grows only with what it shows.
 * The desktop shell comes first, right under the web app it loads.
 */
export const layoutOf = (stack: Stack): Layout => {
  const web = stack.framework !== undefined;
  const inWebBox = webBoxBlocks(stack);

  let floor = web
    ? Math.max(...inWebBox.map((rect) => rect.y + rect.height)) + boxPadding
    : frameworkFold.y + frameworkFold.height;

  const placed: Partial<Record<Client, Placed>> = {};

  for (const client of clients.filter((kind) => stack[kind] !== undefined)) {
    const top =
      floor +
      (client === "desktop" ? shellGap : clientGap) +
      boxPadding +
      boxLabel;

    placed[client] = {
      folded: false,
      rect: {
        height: clientHeight,
        width: blocks.framework.width,
        x: blocks.framework.x,
        y: top,
      },
    };
    floor = top + clientHeight + boxPadding;
  }

  let gap = clientGap;

  for (const client of clients.filter((kind) => stack[kind] === undefined)) {
    const top = floor + gap;
    placed[client] = {
      folded: true,
      rect: {
        height: foldHeight,
        width: blocks.framework.width,
        x: blocks.framework.x,
        y: top,
      },
    };
    floor = top + foldHeight;
    gap = foldGap;
  }

  const railTop = Math.max(floor, serverFloor) + railGap + 34;

  return {
    blocks: {
      auth: { folded: false, rect: blocks.auth },
      backend: { folded: false, rect: blocks.backend },
      database: { folded: false, rect: blocks.database },
      desktop: placed.desktop ?? { folded: true, rect: frameworkFold },
      framework: web
        ? { folded: false, rect: blocks.framework }
        : { folded: true, rect: frameworkFold },
      mobile: placed.mobile ?? { folded: true, rect: frameworkFold },
    },
    height: railTop + railHeight + 16,
    rail: { height: railHeight, width: 1048, x: 196, y: railTop },
  };
};

export const placedClass = "absolute top-(--y) left-(--x) h-(--h) w-(--w)";

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
  readonly id: "web" | "server" | "database" | "desktop" | "mobile";
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

// A database server is a process of its own; SQLite lives in the server's.
const databaseProcesses = {
  mongodb: () => m.mongodb_process(),
  mysql: () => m.mysql_process(),
  postgres: () => m.postgres_process(),
};

const isServerDatabase = (
  database: string
): database is keyof typeof databaseProcesses =>
  Object.hasOwn(databaseProcesses, database);

const databaseProcess = (database: string | undefined) =>
  database !== undefined && isServerDatabase(database)
    ? databaseProcesses[database]
    : undefined;

export const processBoxes = (stack: Stack): ProcessBox[] => {
  const { blocks: placed } = layoutOf(stack);
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

  const server = databaseProcess(stack.database);

  if (server !== undefined) {
    boxes.push({
      deployed: stack.deployment !== "void",
      group: "database",
      id: "database",
      label: server(),
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
      rect: around([placed.desktop.rect], boxPadding, boxLabel),
    });
  }

  if (has(stack, "mobile")) {
    boxes.push({
      deployed: false,
      group: "mobile",
      id: "mobile",
      label: m.expo_process(),
      node: false,
      rect: around([placed.mobile.rect], boxPadding, boxLabel),
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

/** Where every client's calls meet the server: the API capsule, halfway between the web app and the server. */
export const apiAnchor: Point = midpoint(
  right(blocks.framework),
  left(blocks.backend)
);

/** Between the web app's box and the desktop shell's, where the capsule naming what the shell loads sits. */
export const distAnchor = (stack: Stack): Point => {
  const shell = layoutOf(stack).blocks.desktop.rect;
  const inWebBox = webBoxBlocks(stack);

  // The capsule sits midway between what is drawn: the web app's process box, or the deployment frame around it.
  const webFloor =
    Math.max(...inWebBox.map((rect) => rect.y + rect.height)) +
    boxPadding +
    (stack.deployment === undefined ? 0 : framePadding);

  return {
    x: top(blocks.framework).x,
    y: (webFloor + shell.y - boxPadding - boxLabel) / 2,
  };
};

// Each client below the web app runs its own lane up to the API capsule, so the calls visibly share one API.
// The lanes sit side by side, the upper client's nearer, so no wire crosses another.
const lanes: Record<Client, number> = {
  desktop: apiAnchor.x - 12,
  mobile: apiAnchor.x + 12,
};

const laneRadius = 18;

const clientWire = (rect: Rect, lane: number, meetsLine: boolean) => {
  const start = right(rect);
  const turn = `L ${lane - laneRadius} ${start.y} Q ${lane} ${start.y} ${lane} ${start.y - laneRadius}`;

  if (meetsLine) {
    // A wire from the web app or the visitors runs through the capsule, which covers where the lane ends.
    const end = { x: lane, y: apiAnchor.y };

    return {
      end,
      path: `M ${start.x} ${start.y} ${turn} L ${end.x} ${end.y}`,
      start,
    };
  }

  const end = left(blocks.backend);

  return {
    end,
    path: `M ${start.x} ${start.y} ${turn} L ${lane} ${end.y + laneRadius} Q ${lane} ${end.y} ${lane + laneRadius} ${end.y} L ${end.x} ${end.y}`,
    start,
  };
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
  const { blocks: placed } = layoutOf(stack);
  const meetsLine = framework || backend;
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
    !placed.desktop.folded && {
      ...line(bottom(blocks.framework), top(placed.desktop.rect)),
      from: "framework",
      ghost: false,
      id: "framework-desktop",
      to: "desktop",
    },
    ...clients.map(
      (client) =>
        !placed[client].folded && {
          ...clientWire(placed[client].rect, lanes[client], meetsLine),
          from: client,
          ghost: !backend,
          id: `${client}-backend`,
          to: "backend" as const,
        }
    ),
    !framework &&
      backend && {
        ...line(right(blocks.visitors), left(blocks.backend)),
        from: "foundation",
        ghost: false,
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
