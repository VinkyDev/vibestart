import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  Container,
  Cpu,
  Database,
  KeyRound,
  MousePointerClick,
  PanelsTopLeft,
  Plug,
  Plus,
  Server,
} from "lucide-react";

import { cn } from "@vibestart/ui/lib/utils";

import type { Decision } from "#/lib/stack.ts";

const icons: Record<Decision, LucideIcon> = {
  testing: MousePointerClick,
  runtime: Cpu,
  api: Plug,
  auth: KeyRound,
  backend: Server,
  database: Database,
  deployment: Container,
  desktop: AppWindow,
  framework: PanelsTopLeft,
};

export const Swatch = ({
  empty = false,
  icon: Icon,
}: {
  readonly empty?: boolean;
  readonly icon: LucideIcon;
}) => (
  <span
    className={cn(
      "grid size-7 shrink-0 place-items-center rounded-lg transition-colors",
      empty
        ? "bg-foreground/5 text-muted-foreground group-hover/trigger:bg-tint-soft group-hover/trigger:text-tint"
        : "bg-tint-soft text-tint"
    )}
  >
    <Icon className="size-4" strokeWidth={1.75} />
  </span>
);

export const Tile = ({
  empty = false,
  kind,
}: {
  readonly empty?: boolean;
  readonly kind: Decision;
}) => <Swatch empty={empty} icon={empty ? Plus : icons[kind]} />;
