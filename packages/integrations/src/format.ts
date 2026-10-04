// Generated files are formatted afterwards (`formatLikeProject`), so these helpers build content,
// not layout. Shell in Markdown code blocks is the exception oxfmt leaves to us.

export const markdownTable = (
  header: readonly string[],
  rows: readonly (readonly string[])[]
) =>
  [header, header.map(() => "-"), ...rows]
    .map((cells) => `| ${cells.join(" | ")} |`)
    .join("\n");

export const quote = (value: string) => JSON.stringify(value);

export const joinWords = (words: readonly string[]) =>
  words.length <= 2
    ? words.join(" and ")
    : `${words.slice(0, -1).join(", ")}, and ${words.at(-1)}`;

/** Shell lines whose trailing `# comments` start in one column, three spaces after the longest commented command. */
export const commentedShell = (
  lines: readonly (readonly [command: string, comment?: string])[]
) => {
  const column = Math.max(
    ...lines.map(([command, comment]) =>
      comment === undefined ? 0 : command.length
    )
  );
  return lines
    .map(([command, comment]) =>
      comment === undefined
        ? command
        : `${command.padEnd(column)}   # ${comment}`
    )
    .join("\n");
};
