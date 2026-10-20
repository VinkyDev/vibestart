// Pre-commit check: a file someone authors stays under MAX_TOKENS so an agent can read it whole.
// `vp staged` appends the staged paths as arguments.
import { execFileSync } from "node:child_process";
import { closeSync, lstatSync, openSync, readSync } from "node:fs";

const MAX_TOKENS = 5000;
const BYTES_PER_TOKEN = 4;

const tokens = (bytes: number) => Math.ceil(bytes / BYTES_PER_TOKEN);

// Git's own test for binary content: a NUL byte in the first 8000 bytes.
const isBinary = (path: string) => {
  const fd = openSync(path, "r");

  try {
    const head = Buffer.alloc(8000);
    const read = readSync(fd, head, 0, head.length, 0);

    return head.subarray(0, read).includes(0);
  } finally {
    closeSync(fd);
  }
};

// `.gitattributes` is the one list of files nobody authors: lockfiles, snapshots, goldens,
// codegen and vendored code carry `linguist-generated` or `linguist-vendored`.
const unauthored = (paths: readonly string[]) => {
  const fields = execFileSync(
    "git",
    ["check-attr", "-z", "--stdin", "linguist-generated", "linguist-vendored"],
    { encoding: "utf-8", input: `${paths.join("\0")}\0` }
  ).split("\0");

  const marked = new Set<string>();

  // Output is `path NUL attribute NUL value NUL` per attribute.
  for (let i = 0; i + 2 < fields.length; i += 3) {
    const path = fields[i];
    const value = fields[i + 2];

    if (
      path !== undefined &&
      value !== "unspecified" &&
      value !== "unset" &&
      value !== "false"
    ) {
      marked.add(path);
    }
  }

  return marked;
};

const paths = process.argv.slice(2);
const skipped = unauthored(paths);

// A symlink is committed as its target path, not as the content it points to.
const oversized = paths
  .filter(
    (path) => !skipped.has(path) && lstatSync(path).isFile() && !isBinary(path)
  )
  .map((path) => ({ path, tokens: tokens(lstatSync(path).size) }))
  .filter((file) => file.tokens > MAX_TOKENS);

if (oversized.length > 0) {
  const list = oversized
    .map((file) => `  ${file.path}: ${file.tokens} tokens`)
    .join("\n");

  console.error(`Commit blocked: ${oversized.length === 1 ? "this file exceeds" : "these files exceed"} ${MAX_TOKENS} tokens (file bytes / ${BYTES_PER_TOKEN}).

${list}

Split each file by responsibility, then \`git add\` the new files and commit again:

  1. List the file's distinct responsibilities (a group of related functions, a
     component and its helpers, a set of test cases, a section of a document).
  2. Move each one into its own file beside the original, named for what it owns
     (\`parse-config.ts\`), not for its size (\`part-2.ts\`). Aim for ${MAX_TOKENS / 2} tokens each.
  3. Code: move the declarations with their exports, point every import at the new
     file, and delete what no longer belongs. Leave no re-export in the old file.
  4. Tests: one file per subject; shared setup goes in a helper the test files import.
  5. Markdown: one topic per file, plus a short index that links the parts.
  6. Data (JSON, YAML, fixtures): split by key or record group.

Do not mark a hand-written file in \`.gitattributes\` to skip this check. That is for files a tool writes.`);
  process.exitCode = 1;
}
