declare module "virtual:vibestart" {
  import type { RegistryInfo } from "@vibestart/core";

  import type { StackEntries } from "#/lib/project.ts";

  /** The project name the previews are generated for. */
  export const previewName: string;
  export const registry: RegistryInfo;
  export const stackEntries: StackEntries;
}
