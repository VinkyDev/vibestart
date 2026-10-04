import type { TableOfContents } from "fumadocs-core/toc";
import { ScrollProvider, TOCItem, useActiveAnchor } from "fumadocs-core/toc";
import { AlignLeft } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import { spring } from "#/lib/motion.ts";
import { m } from "#/paraglide/messages.js";

export const Toc = ({ toc }: { readonly toc: TableOfContents }) => {
  const container = useRef<HTMLElement>(null);
  const active = useActiveAnchor();

  return (
    <aside
      className="top-header sticky hidden h-[calc(100svh-var(--spacing-header))] w-56 shrink-0 overflow-y-auto overscroll-contain py-12 pr-4 xl:block"
      ref={container}
    >
      {toc.length > 0 && (
        <ScrollProvider containerRef={container}>
          <p className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-medium">
            <AlignLeft className="size-3.5" strokeWidth={2} />
            {m.docs_on_this_page()}
          </p>
          <ul className="border-border flex flex-col border-l">
            {toc.map((item) => (
              <li className="relative" key={item.url}>
                {item.url === `#${active}` && (
                  <motion.span
                    className="bg-foreground absolute inset-y-0.5 -left-px w-px"
                    layoutId="toc-thumb"
                    transition={spring}
                  />
                )}
                <TOCItem
                  className={cn(
                    "text-muted-foreground hover:text-foreground data-[active=true]:text-foreground text-snippet block py-1 leading-snug transition-colors",
                    item.depth > 2 ? "pl-6" : "pl-3"
                  )}
                  href={item.url}
                >
                  {item.title}
                </TOCItem>
              </li>
            ))}
          </ul>
        </ScrollProvider>
      )}
    </aside>
  );
};
