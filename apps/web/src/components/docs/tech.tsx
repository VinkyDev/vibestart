import { ArrowUpRight } from "lucide-react";

import type { TechIcon } from "#/components/docs/tech-icons.ts";
import { techIcons } from "#/components/docs/tech-icons.ts";

export const TechMark = ({
  className,
  icon,
}: {
  readonly className?: string;
  readonly icon: TechIcon;
}) => (
  <img
    alt=""
    className={className}
    decoding="async"
    height={20}
    loading="lazy"
    src={techIcons[icon]}
    width={20}
  />
);

export const Tech = ({
  href,
  icon,
  paired,
}: {
  readonly href: string;
  readonly icon: TechIcon;
  readonly paired?: TechIcon;
}) => {
  const icons = paired === undefined ? [icon] : [icon, paired];
  return (
    <p className="-mt-1 mb-5">
      <a
        className="group/tech bg-card shadow-rest hover:shadow-lift inline-flex items-center gap-2.5 rounded-full py-1 pr-3.5 pl-1 text-xs transition-shadow"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        <span className="flex -space-x-1.5">
          {icons.map((name) => (
            <span
              className="bg-background ring-card grid size-7 place-items-center rounded-full ring-2"
              key={name}
            >
              <TechMark className="size-4 object-contain" icon={name} />
            </span>
          ))}
        </span>
        <span className="text-foreground/80 group-hover/tech:text-foreground font-mono transition-colors">
          {new URL(href).host}
        </span>
        <ArrowUpRight className="text-muted-foreground group-hover/tech:text-foreground size-3.5 transition group-hover/tech:translate-x-0.5 group-hover/tech:-translate-y-0.5" />
      </a>
    </p>
  );
};
