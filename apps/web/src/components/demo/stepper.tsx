import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

import { Button } from "@vibestart/ui/components/button";

import { m } from "#/paraglide/messages.js";

export const Stepper = ({
  count,
  current,
  onChange,
}: {
  readonly count: number;
  readonly current: number;
  readonly onChange: (step: number) => void;
}) => {
  const last = current === count - 1;
  return (
    <>
      <Button
        aria-label={m.viz_prev()}
        disabled={current === 0}
        onClick={() => {
          onChange(current - 1);
        }}
        size="icon-sm"
        variant="ghost"
      >
        <ArrowLeft />
      </Button>
      <Button
        onClick={() => {
          onChange(last ? 0 : current + 1);
        }}
        size="sm"
        variant={last ? "ghost" : "secondary"}
      >
        {last ? (
          <>
            <RotateCcw />
            {m.viz_replay()}
          </>
        ) : (
          <>
            {m.viz_next()}
            <ArrowRight />
          </>
        )}
      </Button>
    </>
  );
};
