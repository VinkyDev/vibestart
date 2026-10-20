// Pre-commit check: an authored file stays under MAX_TOKENS so an agent can read it whole.
// `vp staged` appends the staged paths as arguments.
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";

const MAX_TOKENS = 5000;
const BYTES_PER_TOKEN = 4;

const tokens = (bytes: number) => Math.ceil(bytes / BYTES_PER_TOKEN);

// `.gitattributes` is the one list of files nobody authors: lockfiles, snapshots, goldens,
// codegen and vendored code carry `linguist-generated` or `linguist-vendored`.
const authoredOnly = (paths: readonly string[]): string[] => {
  const marked = new Set<string>();

  const out = execFileSync(
    "git",
    ["check-attr", "-z", "--stdin", "linguist-generated", "linguist-vendored"],
    { encoding: "utf-8", input: `${paths.join("\0")}\0` }
  );

  const fields = out.split("\0");

  for (let i = 0; i + 2 < fields.length; i += 3) {
    const [path, , value] = [fields[i], fields[i + 1], fields[i + 2]];

    if (
      path !== undefined &&
      value !== "unspecified" &&
      value !== "unset" &&
      value !== "false"
    ) {
      marked.add(path);
    }
  }

  return paths.filter((path) => !marked.has(path));
};

const offenders = authoredOnly(process.argv.slice(2))
  .map((path) => ({ bytes: statSync(path).size, path }))
  .filter(({ bytes }) => tokens(bytes) > MAX_TOKENS);

if (offenders.length > 0) {
  const list = offenders
    .map(
      ({ bytes, path }) => `  ${path}: ${tokens(bytes)} tokens (${bytes} bytes)`
    )
    .join("\n");

  console.error(`Commit blocked: these staged files exceed ${MAX_TOKENS} tokens (bytes / ${BYTES_PER_TOKEN}).

${list}

Split each file into smaller files by responsibility, then stage the new files:

  1. Read the file and list its distinct responsibilities: a group of related
     functions, a component and its helpers, a set of test cases, a document section.
  2. Move each responsibility into its own file beside the original, named for what
     it owns (\`parse-config.ts\`, \`user-table.tsx\`), not for its size (\`part-2.ts\`).
     Aim for about ${MAX_TOKENS / 2} tokens each, and keep each new file under ${MAX_TOKENS}.
  3. Code: move the declarations and keep their exports. Update every import of the
     moved names to the new file. Do not leave a re-export in the old file; delete
     the old file, or keep it only for what still belongs in it.
  4. Tests: split by the behavior under test, one file per subject, and move shared
     setup into a helper file the test files import.
  5. Markdown: one topic per file. Leave a short index file that links to the parts.
  6. Data (JSON, YAML, fixtures): split by key or record group, and load the parts
     from one place.
  7. Run \`vp check\` and \`vp test\`, \`git add\` the new files, and commit again.

If the file is generated or vendored rather than written by hand, mark it in
\`.gitattributes\` with \`linguist-generated\` or \`linguist-vendored\` and the check
skips it.`);
  process.exit(1);
}
