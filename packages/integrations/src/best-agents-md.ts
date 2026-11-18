import bestAgentsStandard from "./best-agents-md.md?raw";

/** The general coding standard from best-agents-md. Its CLI replaces this block on the next release. */
export const bestAgentsMd = [
  "<!-- best-agents-md:start -->",
  "",
  bestAgentsStandard.trimEnd(),
  "",
  "<!-- best-agents-md:end -->",
].join("\n");
