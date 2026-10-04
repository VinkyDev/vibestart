import type { IntegrationInfo, Stack } from "@vibestart/core";
import { cn } from "@vibestart/ui/lib/utils";

import { capsuleClass } from "#/components/topology/capsule.tsx";
import { IntegrationCard } from "#/components/topology/integration-card.tsx";
import { groupOf, tintClass } from "#/lib/roles.ts";

export const Chip = ({
  compact = false,
  integration,
  label,
  stack,
}: {
  readonly compact?: boolean;
  readonly integration: IntegrationInfo;
  readonly label?: string;
  readonly stack: Stack;
}) => (
  <IntegrationCard integration={integration} stack={stack}>
    <span
      className={cn(
        tintClass[groupOf(integration.id)],
        // On a wire it sits on the canvas, so it is white with a hairline; on a card it is a grey wash.
        label === undefined
          ? cn(
              "text-foreground/75 bg-foreground/5 inline-flex items-center gap-1.5 rounded-full text-xs font-medium",
              compact ? "h-5 px-2" : "h-6 px-2.5"
            )
          : cn(capsuleClass, "bg-card text-foreground shadow-rest"),
        "group-hover/card:bg-tint-soft group-data-[focused]/card:bg-tint-soft group-data-popup-open/card:bg-tint-soft group-hover/card:text-foreground group-data-popup-open/card:text-foreground group-focus-visible/card:focus-ring transition-colors"
      )}
    >
      <span className="bg-tint size-1.5 rounded-full" />
      {label !== undefined && (
        <span className="text-muted-foreground">{label}</span>
      )}
      {integration.name}
    </span>
  </IntegrationCard>
);
