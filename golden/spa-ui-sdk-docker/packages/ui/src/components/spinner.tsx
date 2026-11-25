import { LoaderCircle } from "lucide-react";

export const Spinner = () => (
  <output aria-label="Loading">
    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
  </output>
);
