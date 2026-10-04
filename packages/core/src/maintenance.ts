import { diffIndices, mergeDiff3 } from "node-diff3";

import { mergeJson } from "#/merge-json.ts";

export interface FileChange {
  readonly path: string;
  readonly before: string | null;
  readonly after: string | null;
  readonly conflict: boolean;
}

/** Absence is distinct from an empty file. Removed ownership never deletes user files. */
export const mergeFile = (
  path: string,
  base: string | null,
  local: string | null,
  target: string | null
): FileChange => {
  if (target === base || target === null || local === target) {
    return { after: local, before: local, conflict: false, path };
  }
  if (local === base) {
    return { after: target, before: local, conflict: false, path };
  }
  if (base === null || local === null) {
    return { after: target, before: local, conflict: true, path };
  }
  if (/\.jsonc?$/u.test(path)) {
    const merged = mergeJson(base, local, target);
    return {
      after: merged.conflict
        ? [
            "<<<<<<< project",
            local,
            "||||||| previous template",
            base,
            "=======",
            target,
            ">>>>>>> target template",
          ].join("\n")
        : merged.result,
      before: local,
      conflict: merged.conflict,
      path,
    };
  }
  const merged = mergeDiff3(
    local.split("\n"),
    base.split("\n"),
    target.split("\n"),
    {
      label: { a: "project", o: "previous template", b: "target template" },
    }
  );
  return {
    after: merged.result.join("\n"),
    before: local,
    conflict: merged.conflict,
    path,
  };
};

export const diffText = ({ path, before, after }: FileChange) => {
  const changes = diffIndices(
    before?.split("\n") ?? [],
    after?.split("\n") ?? []
  );
  return [
    `--- ${before === null ? "/dev/null" : path}`,
    `+++ ${after === null ? "/dev/null" : path}`,
    ...changes.flatMap(
      ({ buffer1, buffer1Content, buffer2, buffer2Content }) => [
        `@@ -${buffer1[0] + 1},${buffer1[1]} +${buffer2[0] + 1},${buffer2[1]} @@`,
        ...buffer1Content.map((line) => `-${line}`),
        ...buffer2Content.map((line) => `+${line}`),
      ]
    ),
  ].join("\n");
};
