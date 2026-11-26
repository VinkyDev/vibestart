import { cn } from "@my-app/ui/lib/utils";

/** One layer of the stack, drawn isometrically: the project's mark, from the home page to sign-in. */
export const StackPlate = ({ active }: { active: boolean }) => {
  const side = cn(
    "transition-colors duration-300",
    active
      ? "fill-primary/70 stroke-primary"
      : "fill-muted stroke-foreground/25"
  );

  return (
    <svg
      aria-hidden="true"
      className="size-full overflow-visible drop-shadow-lg"
      viewBox="0 0 200 114"
    >
      <polygon className={side} points="0,50 100,100 100,114 0,64" />
      <polygon className={side} points="100,100 200,50 200,64 100,114" />
      <polygon
        className={cn(
          "transition-colors duration-300",
          active
            ? "fill-primary stroke-primary"
            : "fill-card stroke-foreground/25"
        )}
        points="100,0 200,50 100,100 0,50"
      />
    </svg>
  );
};
