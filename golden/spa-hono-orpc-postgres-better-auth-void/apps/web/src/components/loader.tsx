import { Loader2Icon } from "lucide-react";

export const Loader = () => (
  <div className="flex h-full items-center justify-center pt-8">
    <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
  </div>
);
