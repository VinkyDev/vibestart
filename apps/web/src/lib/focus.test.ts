import { describe, expect, it } from "vite-plus/test";

import { restoreFocus } from "#/lib/focus.ts";

const tool = { owner: "vite-plus" } as const;
const next = { owner: "playwright" } as const;
const group = { group: "foundation" } as const;

describe("map focus transitions", () => {
  it("keeps the new tool focused when the previous tool's popup closes late", () => {
    expect(restoreFocus(next, tool, null)).toStrictEqual(next);
  });

  it("returns to the enclosing map group when its active tool closes", () => {
    expect(restoreFocus(tool, tool, group)).toStrictEqual(group);
  });

  it("clears focus when a tool without an enclosing group closes", () => {
    expect(restoreFocus(tool, tool, null)).toBeNull();
  });
});
