import bestAgentsStandard from "./best-agents-md.md?raw";

/** The pinned best-agents-md release, inside the markers its CLI replaces. */
export const bestAgentsMd = [
  "<!-- best-agents-md:start -->",
  "",
  bestAgentsStandard.trimEnd(),
  "",
  "<!-- best-agents-md:end -->",
].join("\n");
