import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { docsTarget } from "#/lib/docs/source.ts";

export const DocLink = ({
  children,
  className,
  onClick,
  url,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly onClick?: () => void;
  readonly url: string;
}) => {
  const { hash, splat } = docsTarget(url);
  return (
    <Link
      activeOptions={{ exact: true }}
      className={className}
      hash={hash}
      onClick={onClick}
      params={{ _splat: splat }}
      to="/docs/$"
    >
      {children}
    </Link>
  );
};
