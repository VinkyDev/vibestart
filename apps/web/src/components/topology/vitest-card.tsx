import type { ReactNode } from "react";

import type { Stack } from "@vibestart/core";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@vibestart/ui/components/popover";

import { CardHeading } from "#/components/topology/integration-card.tsx";
import { ToolDetails } from "#/components/topology/tool-details.tsx";

export const VitestCard = ({
  children,
  className,
  stack,
}: {
  readonly children: ReactNode;
  readonly className: string;
  readonly stack: Stack;
}) => (
  <Popover>
    <PopoverTrigger
      className={className}
      closeDelay={120}
      delay={180}
      openOnHover
    >
      {children}
    </PopoverTrigger>
    <PopoverContent
      className="w-72"
      initialFocus={(openType) => openType === "keyboard"}
      side="top"
      sideOffset={8}
    >
      <div className="tint-foundation flex flex-col gap-2 p-2.5 text-xs leading-relaxed">
        <CardHeading homepage="https://vitest.dev" name="Vitest" />
        <ToolDetails id="vitest" stack={stack} />
      </div>
    </PopoverContent>
  </Popover>
);
