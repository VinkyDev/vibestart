import { Path, Paths } from "#/components/docs/paths.tsx";
import {
  Callout,
  Card,
  Cards,
  proseComponents,
  Step,
  Steps,
} from "#/components/docs/prose.tsx";
import { Tab, Tabs } from "#/components/docs/tabs.tsx";
import { Tech } from "#/components/docs/tech.tsx";
import { FeatureFlow } from "#/components/docs/viz/feature-flow.tsx";
import { FeedbackLoop } from "#/components/docs/viz/feedback-loop.tsx";
import { HowItWorks } from "#/components/docs/viz/how-it-works.tsx";
import { ImageBuild } from "#/components/docs/viz/image-build.tsx";
import { Journey } from "#/components/docs/viz/journey.tsx";
import { KindOptions } from "#/components/docs/viz/kind-options.tsx";
import { RenderRace } from "#/components/docs/viz/render-race.tsx";
import { SchemaMigration } from "#/components/docs/viz/schema-migration.tsx";
import { StackMap } from "#/components/docs/viz/stack-map.tsx";
import { TestScope } from "#/components/docs/viz/test-scope.tsx";
import { TestValue } from "#/components/docs/viz/test-value.tsx";

export const mdxComponents = {
  ...proseComponents,
  Callout,
  Card,
  Cards,
  FeatureFlow,
  FeedbackLoop,
  HowItWorks,
  ImageBuild,
  Journey,
  KindOptions,
  Path,
  Paths,
  RenderRace,
  SchemaMigration,
  StackMap,
  Step,
  Steps,
  Tab,
  Tabs,
  Tech,
  TestScope,
  TestValue,
};
