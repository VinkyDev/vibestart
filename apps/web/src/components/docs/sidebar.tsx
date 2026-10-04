import { Dialog } from "@base-ui/react/dialog";
import { useLocation } from "@tanstack/react-router";
import { ChevronRight, PanelLeft, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { DocLink } from "#/components/docs/doc-link.tsx";
import { groupOf, nav } from "#/lib/docs/source.ts";
import { spring } from "#/lib/motion.ts";
import { m } from "#/paraglide/messages.js";

const Nav = ({
  id,
  onNavigate,
}: {
  readonly id: string;
  readonly onNavigate?: () => void;
}) => {
  const { pathname } = useLocation();
  return (
    <nav aria-label={m.docs_nav()} className="flex flex-col gap-6">
      {nav.map((group, index) => (
        // Group names repeat nothing and never reorder, so their place is their identity.
        // oxlint-disable-next-line react/no-array-index-key
        <section className="flex flex-col gap-1.5" key={index}>
          {group.name !== undefined && (
            <h2 className="text-foreground px-3 text-xs font-semibold">
              {group.name}
            </h2>
          )}
          <ul className="flex flex-col gap-px">
            {group.pages.map((page) => (
              <li key={page.url}>
                <DocLink
                  className="text-muted-foreground hover:text-foreground hover:bg-foreground/[0.035] data-[status=active]:text-foreground focus-visible:ring-foreground/30 relative flex rounded-lg px-3 py-1 text-sm leading-6 transition-colors outline-none focus-visible:ring-2 data-[status=active]:font-medium"
                  onClick={onNavigate}
                  url={page.url}
                >
                  {page.url === pathname && (
                    <motion.span
                      className="bg-card shadow-rest absolute inset-0 rounded-lg"
                      layoutId={id}
                      transition={spring}
                    />
                  )}
                  <span className="relative">{page.name}</span>
                </DocLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
};

export const Sidebar = () => (
  <aside className="top-header sticky hidden h-[calc(100svh-var(--spacing-header))] w-64 shrink-0 overflow-y-auto overscroll-contain py-8 pr-3 pl-4 lg:block">
    <Nav id="docs-page" />
  </aside>
);

export const MobileNav = ({ title }: { readonly title: string }) => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const group = groupOf.get(pathname);

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <div className="top-header bg-background/80 supports-backdrop-filter:bg-background/65 border-border sticky z-30 flex h-11 items-center border-b px-4 backdrop-blur-md sm:px-6 lg:hidden">
        <Dialog.Trigger className="text-muted-foreground hover:text-foreground flex min-w-0 items-center gap-2 text-sm transition-colors">
          <PanelLeft className="size-4 shrink-0" strokeWidth={1.75} />
          {group !== undefined && (
            <>
              <span className="shrink-0">{group}</span>
              <ChevronRight className="size-3.5 shrink-0 opacity-50" />
            </>
          )}
          <span className="text-foreground truncate">{title}</span>
        </Dialog.Trigger>
      </div>
      <Dialog.Portal>
        <Dialog.Backdrop className="bg-foreground/20 fixed inset-0 z-50 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="bg-background shadow-pop fixed inset-y-0 left-0 z-50 flex w-[min(20rem,85vw)] flex-col transition-transform duration-300 ease-out data-ending-style:-translate-x-full data-starting-style:-translate-x-full">
          <div className="flex h-14 shrink-0 items-center justify-between px-4">
            <Dialog.Title className="text-sm font-medium">
              {m.nav_docs()}
            </Dialog.Title>
            <Dialog.Close
              aria-label={m.close()}
              className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 grid size-8 place-items-center rounded-lg transition-colors"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-8">
            <Nav
              id="docs-page-sheet"
              onNavigate={() => {
                setOpen(false);
              }}
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
