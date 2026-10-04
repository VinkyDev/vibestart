import type { JSONPath, ParseError } from "jsonc-parser";
import { applyEdits, modify, parse } from "jsonc-parser";
import { z } from "zod";

type Value = z.infer<ReturnType<typeof z.json>> | undefined;
const jsonObject = z.record(z.string(), z.json());
const object = (value: Value): value is z.infer<typeof jsonObject> =>
  jsonObject.safeParse(value).success;
const equal = (left: Value, right: Value): boolean => {
  if (object(left) && object(right)) {
    return (
      Object.keys(left).length === Object.keys(right).length &&
      Object.entries(left).every(([key, value]) => equal(value, right[key]))
    );
  }
  return JSON.stringify(left) === JSON.stringify(right);
};

const read = (text: string) => {
  const errors: ParseError[] = [];
  const value: unknown = parse(text, errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    throw new Error("Invalid JSONC configuration");
  }
  return z.json().parse(value);
};

export const mergeJson = (base: string, local: string, target: string) => {
  let result = local;
  let conflict = false;
  const visit = (
    before: Value,
    current: Value,
    after: Value,
    path: JSONPath
  ) => {
    if (equal(before, after) || equal(current, after)) {
      return;
    }
    if (object(before) && object(current) && object(after)) {
      for (const key of new Set([
        ...Object.keys(before),
        ...Object.keys(after),
      ])) {
        visit(before[key], current[key], after[key], [...path, key]);
      }
      return;
    }
    if (!equal(before, current)) {
      conflict = true;
      return;
    }
    result = applyEdits(
      result,
      modify(result, path, after, {
        formattingOptions: { insertSpaces: true, tabSize: 2 },
      })
    );
  };
  visit(read(base), read(local), read(target), []);
  return { conflict, result };
};
