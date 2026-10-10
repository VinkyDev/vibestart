import { describe, expect, it } from "vite-plus/test";

import type { Requirement } from "#/integration.ts";
import { defineIntegration } from "#/integration.ts";
import { defineRegistry } from "#/registry.ts";
import {
  check,
  choicesOf,
  compose,
  kindOptions,
  legalStacks,
  openChoices,
  resolve,
  startingChoice,
} from "#/resolver.ts";

const integration = (
  id: string,
  kind: string,
  options: {
    auxiliary?: boolean;
    provides?: string[];
    requires?: Requirement[];
  } = {}
) =>
  defineIntegration({
    contribute: () => [],
    description: `The ${id} integration`,
    id,
    kind,
    name: id.toUpperCase(),
    ...options,
  });

const registry = defineRegistry({
  addons: [],
  capabilities: {
    "http-server": "an HTTP server",
    "node-runtime": "a Node.js runtime",
  },
  catalog: {},
  integrations: [
    integration("vp", "toolchain"),
    integration("spa", "framework", { requires: ["http-server"] }),
    integration("next", "framework", {
      provides: ["http-server"],
      requires: ["node-runtime"],
    }),
    integration("static", "framework"),
    integration("hono", "backend", {
      provides: ["http-server"],
      requires: ["node-runtime"],
    }),
    integration("node", "runtime", {
      auxiliary: true,
      provides: ["node-runtime"],
    }),
  ],
  kindGroups: [["framework", "backend"]],
  kinds: [
    { id: "toolchain", name: "Toolchain", optional: false },
    { id: "framework", name: "Framework", optional: true },
    { id: "backend", name: "Backend", optional: true },
    { id: "runtime", name: "Runtime", optional: true },
  ],
});

describe(check, () => {
  it("accepts a legal stack", () => {
    expect(
      check(registry, {
        backend: "hono",
        framework: "spa",
        runtime: "node",
        toolchain: "vp",
      })
    ).toStrictEqual([]);
  });

  it("explains a missing required kind and capability", () => {
    expect(check(registry, { framework: "next" })).toStrictEqual([
      {
        kinds: ["toolchain"],
        reason: "Toolchain is required.",
        type: "missing-kind",
      },
      {
        capabilities: ["node-runtime"],
        integration: "next",
        reason:
          "NEXT requires a Node.js runtime, but nothing in the stack provides it.",
        type: "missing-capability",
      },
    ]);
  });

  it("explains an empty kind group", () => {
    expect(check(registry, { toolchain: "vp" })).toStrictEqual([
      {
        kinds: ["framework", "backend"],
        reason: "Framework or Backend is required.",
        type: "missing-kind",
      },
    ]);
  });

  it("explains a capability two integrations provide", () => {
    expect(
      check(registry, {
        backend: "hono",
        framework: "next",
        runtime: "node",
        toolchain: "vp",
      })
    ).toStrictEqual([
      {
        capability: "http-server",
        integrations: ["next", "hono"],
        reason:
          "NEXT and HONO each provide an HTTP server; a stack can have only one.",
        type: "shared-capability",
      },
    ]);
  });

  it("explains an auxiliary integration nothing requires", () => {
    expect(
      check(registry, { framework: "static", runtime: "node", toolchain: "vp" })
    ).toStrictEqual([
      {
        integration: "node",
        reason:
          "NODE provides a Node.js runtime, but nothing in the stack requires it.",
        type: "unused-integration",
      },
    ]);
  });
});

describe("a requirement with alternatives", () => {
  const deployable = defineRegistry({
    addons: [],
    capabilities: {
      "http-server": "an HTTP server",
      "web-app": "a web app",
    },
    catalog: {},
    integrations: [
      integration("vp", "toolchain"),
      integration("spa", "framework", { provides: ["web-app"] }),
      integration("worker", "framework"),
      integration("hono", "backend", {
        auxiliary: true,
        provides: ["http-server"],
      }),
      integration("docker", "deployment", {
        requires: [["web-app", "http-server"]],
      }),
    ],
    kinds: [
      { id: "toolchain", name: "Toolchain", optional: false },
      { id: "framework", name: "Framework", optional: false },
      { id: "backend", name: "Backend", optional: true },
      { id: "deployment", name: "Deployment", optional: true },
    ],
  });

  it("is met by any one alternative", () => {
    expect(
      check(deployable, {
        deployment: "docker",
        framework: "spa",
        toolchain: "vp",
      })
    ).toStrictEqual([]);
    expect(
      check(deployable, {
        backend: "hono",
        deployment: "docker",
        framework: "worker",
        toolchain: "vp",
      })
    ).toStrictEqual([]);
  });

  it("explains a stack that provides none of the alternatives", () => {
    expect(
      check(deployable, {
        deployment: "docker",
        framework: "worker",
        toolchain: "vp",
      })
    ).toStrictEqual([
      {
        capabilities: ["web-app", "http-server"],
        integration: "docker",
        reason:
          "DOCKER requires a web app or an HTTP server, but nothing in the stack provides it.",
        type: "missing-capability",
      },
    ]);
  });

  it("needs an auxiliary integration only for an alternative nothing else provides", () => {
    expect(
      legalStacks(deployable).filter((stack) => stack.backend === "hono")
    ).toStrictEqual([
      {
        backend: "hono",
        deployment: "docker",
        framework: "worker",
        toolchain: "vp",
      },
    ]);
    expect(
      check(deployable, {
        backend: "hono",
        deployment: "docker",
        framework: "spa",
        toolchain: "vp",
      })
    ).toStrictEqual([
      {
        integration: "hono",
        reason:
          "HONO provides an HTTP server, but nothing in the stack requires it.",
        type: "unused-integration",
      },
    ]);
  });

  it("names only described capabilities", () => {
    expect(() =>
      defineRegistry({
        addons: [],
        capabilities: { "web-app": "a web app" },
        catalog: {},
        integrations: [
          integration("docker", "deployment", {
            requires: [["web-app", "http-server"]],
          }),
        ],
        kinds: [{ id: "deployment", name: "Deployment", optional: false }],
      })
    ).toThrow('Integration "docker" uses undescribed capability "http-server"');
  });
});

describe(legalStacks, () => {
  it("enumerates every legal combination", () => {
    expect(legalStacks(registry)).toStrictEqual([
      { backend: "hono", framework: "spa", runtime: "node", toolchain: "vp" },
      { framework: "next", runtime: "node", toolchain: "vp" },
      {
        backend: "hono",
        framework: "static",
        runtime: "node",
        toolchain: "vp",
      },
      { framework: "static", toolchain: "vp" },
      { backend: "hono", runtime: "node", toolchain: "vp" },
    ]);
  });
});

describe(resolve, () => {
  const spaWithoutServer = choicesOf(registry, {
    framework: "spa",
    runtime: "node",
    toolchain: "vp",
  });

  it("lists every legal stack consistent with the choices", () => {
    expect(resolve(registry, { framework: "static" })).toStrictEqual({
      fixes: [],
      stacks: [
        {
          backend: "hono",
          framework: "static",
          runtime: "node",
          toolchain: "vp",
        },
        { framework: "static", toolchain: "vp" },
      ],
      violations: [],
    });
  });

  it("explains the closest stack and offers the fewest changes", () => {
    expect(resolve(registry, spaWithoutServer)).toStrictEqual({
      fixes: [
        { changes: [{ from: null, kind: "backend", to: "hono" }] },
        { changes: [{ from: "spa", kind: "framework", to: "next" }] },
      ],
      stacks: [],
      violations: [
        {
          capabilities: ["http-server"],
          integration: "spa",
          reason:
            "SPA requires an HTTP server, but nothing in the stack provides it.",
          type: "missing-capability",
        },
        {
          integration: "node",
          reason:
            "NODE provides a Node.js runtime, but nothing in the stack requires it.",
          type: "unused-integration",
        },
      ],
    });
  });

  it("keeps the kind the user just chose", () => {
    expect(
      resolve(registry, spaWithoutServer, { keep: "framework" }).fixes
    ).toStrictEqual([
      { changes: [{ from: null, kind: "backend", to: "hono" }] },
    ]);
  });

  it("leaves undecided kinds out of the changes", () => {
    expect(
      resolve(registry, { backend: null, framework: "spa" }).fixes
    ).toStrictEqual([
      { changes: [{ from: null, kind: "backend", to: "hono" }] },
      { changes: [{ from: "spa", kind: "framework", to: "next" }] },
      { changes: [{ from: "spa", kind: "framework", to: "static" }] },
    ]);
  });

  it("rejects a choice the registry does not offer", () => {
    expect(() => resolve(registry, { toolchain: null })).toThrow(
      'The registry offers no empty choice for kind "toolchain"'
    );
    expect(() => resolve(registry, { framework: "hono" })).toThrow(
      'The registry offers no "hono" for kind "framework"'
    );
  });
});

describe(kindOptions, () => {
  it("explains each option that leaves no legal stack", () => {
    expect(
      kindOptions(registry, { framework: "next" }, "backend").map(
        ({ integration: option, violations }) => ({
          id: option?.id ?? null,
          reasons: violations.map((violation) => violation.reason),
        })
      )
    ).toStrictEqual([
      {
        id: "hono",
        reasons: [
          "NEXT and HONO each provide an HTTP server; a stack can have only one.",
        ],
      },
      { id: null, reasons: [] },
    ]);
  });
});

describe(startingChoice, () => {
  it("starts on the preferred choice when it is open", () => {
    expect(startingChoice(["hono", null], null)).toBeNull();
    expect(startingChoice(["hono", null], "hono")).toBe("hono");
  });

  it("falls back to the first open choice", () => {
    expect(startingChoice(["hono", null], "next")).toBe("hono");
    expect(startingChoice([null, "hono"])).toBeNull();
  });

  it("is undefined when nothing is open", () => {
    expect(startingChoice([], "hono")).toBeUndefined();
  });
});

describe(openChoices, () => {
  it("lists the options that leave a legal stack", () => {
    expect(
      openChoices(kindOptions(registry, { framework: "next" }, "backend"))
    ).toStrictEqual([null]);
  });
});

describe(compose, () => {
  it("starts each open kind on its first open choice", () => {
    expect(compose(registry, {})).toStrictEqual({
      backend: "hono",
      framework: "spa",
      runtime: "node",
      toolchain: "vp",
    });
  });

  it("keeps the choices it is given", () => {
    expect(compose(registry, { framework: "next" })).toStrictEqual({
      framework: "next",
      runtime: "node",
      toolchain: "vp",
    });
  });

  it("starts a kind on its default when that leaves a legal stack", () => {
    const withDefault = defineRegistry({
      ...registry,
      kinds: registry.kinds.map((kind) =>
        kind.id === "backend" ? { ...kind, default: null } : kind
      ),
    });
    expect(compose(withDefault, { framework: "static" })).toStrictEqual({
      framework: "static",
      toolchain: "vp",
    });
    expect(compose(withDefault, { framework: "spa" })).toStrictEqual({
      backend: "hono",
      framework: "spa",
      runtime: "node",
      toolchain: "vp",
    });
  });
});
