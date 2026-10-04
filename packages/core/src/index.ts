export type { Blueprint, PackageManager } from "#/blueprint.ts";
export {
  blueprintJsonSchema,
  blueprintSchemaUrl,
  channels,
  packageManagers,
  createBlueprintSchema,
  renderBlueprint,
} from "#/blueprint.ts";
export type {
  Formatter,
  GeneratedFile,
  Generation,
  GettingStartedNote,
  GettingStartedStep,
  SetupCommand,
} from "#/generator.ts";
export {
  formatter,
  generate,
  gettingStarted,
  IllegalStackError,
  maxProjectNameLength,
  projectNameError,
  setupCommand,
} from "#/generator.ts";
export type {
  Addon,
  AddonInfo,
  Context,
  Contribution,
  Integration,
  IntegrationInfo,
  Kind,
  ReadSlot,
  Slot,
  Stack,
} from "#/integration.ts";
export {
  contribute,
  defineAddon,
  defineIntegration,
  defineSlot,
  file,
  renderFile,
} from "#/integration.ts";
export type { PackageJsonContribution } from "#/package-json.ts";
export { packageJson } from "#/package-json.ts";
export type { PnpmWorkspaceContribution } from "#/pnpm-workspace.ts";
export { pnpmWorkspace } from "#/pnpm-workspace.ts";
export type { Catalog, Registry, RegistryInfo } from "#/registry.ts";
export { addonsInOrder, defaultAddons, defineRegistry } from "#/registry.ts";
export type {
  Change,
  Choices,
  Fix,
  KindOption,
  Resolution,
  Violation,
} from "#/resolver.ts";
export {
  check,
  choicesOf,
  compose,
  kindOptions,
  legalStacks,
  openChoices,
  resolve,
  startingChoice,
  withDefaults,
} from "#/resolver.ts";
export type { Verification } from "#/verification.ts";
export { fingerprint, verificationSchema } from "#/verification.ts";

export { diffText, mergeFile } from "#/maintenance.ts";
export type { FileChange } from "#/maintenance.ts";
