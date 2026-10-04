import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog } from "@base-ui/react/dialog";
import { useNavigate } from "@tanstack/react-router";
import type { SortedResult } from "fumadocs-core/search";
import {
  CornerDownLeft,
  FileText,
  Hash,
  LoaderCircle,
  Search as SearchIcon,
  TextQuote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import { docsTarget, nav } from "#/lib/docs/source.ts";
import { m } from "#/paraglide/messages.js";

interface Row {
  readonly id: string;
  readonly url: string;
  readonly type: SortedResult["type"];
  readonly content: string;
  readonly trail?: string;
}

const pages: readonly Row[] = nav.flatMap((group) =>
  group.pages.map((page) => ({
    content: page.name,
    id: page.url,
    trail: group.name,
    type: "page" as const,
    url: page.url,
  }))
);

const rowsOf = (results: readonly SortedResult[]): Row[] =>
  results.map((result) => ({
    content: result.content,
    id: result.id,
    trail: result.breadcrumbs?.join(" / "),
    type: result.type,
    url: result.url,
  }));

const loadSearch = async () => await import("#/lib/docs/search.ts");

const isMac = () => /Mac|iPhone|iPad/u.test(navigator.userAgent);

const Highlighted = ({ text }: { readonly text: string }) => (
  <>
    {text
      .replaceAll(/[`*_]/gu, "")
      .split(/(?<marked><mark>.*?<\/mark>)/u)
      .map((part, index) => {
        const marked = /^<mark>(?<word>.*)<\/mark>$/u.exec(part)?.groups?.word;
        return marked === undefined ? (
          part
        ) : (
          <mark
            className="text-foreground bg-tint-soft tint-framework rounded-sm px-0.5"
            // The same word can be marked twice, so only its place tells the two apart.
            // oxlint-disable-next-line react/no-array-index-key
            key={index}
          >
            {marked}
          </mark>
        );
      })}
  </>
);

const icons = {
  heading: Hash,
  page: FileText,
  text: TextQuote,
} satisfies Record<Row["type"], LucideIcon>;

const Kbd = ({ children }: { readonly children: ReactNode }) => (
  <kbd className="bg-foreground/[0.06] text-muted-foreground text-fine inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 font-sans font-medium">
    {children}
  </kbd>
);

export const Search = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly Row[]>(pages);
  const [searching, startSearch] = useTransition();
  const latest = useRef("");
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing =
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName));
      const shortcut =
        (event.key === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" && !typing);
      if (shortcut) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const search = (next: string) => {
    setQuery(next);
    latest.current = next;
    if (next.trim() === "") {
      setResults(pages);
      return;
    }
    startSearch(async () => {
      const { searchDocs } = await loadSearch();
      const found = rowsOf(await searchDocs(next));
      // A slower search for an earlier query must not replace a newer one's results.
      if (latest.current === next) {
        startSearch(() => {
          setResults(found);
        });
      }
    });
  };

  const go = (row: Row) => {
    const { hash, splat } = docsTarget(row.url);
    setOpen(false);
    void navigate({ hash, params: { _splat: splat }, to: "/docs/$" });
  };

  return (
    <Dialog.Root
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          search("");
        }
      }}
      open={open}
    >
      <Dialog.Trigger
        aria-label={m.search_docs()}
        className="bg-card text-muted-foreground shadow-rest hover:text-foreground focus-visible:ring-foreground/30 flex h-8 items-center gap-2 rounded-full px-2 text-sm transition-colors outline-none focus-visible:ring-2 sm:w-52 sm:pr-1.5 sm:pl-3"
        onFocus={() => {
          void loadSearch();
        }}
        onPointerEnter={() => {
          void loadSearch();
        }}
      >
        <SearchIcon className="size-4 shrink-0" strokeWidth={2} />
        <span className="hidden flex-1 text-left sm:inline">
          {m.search_placeholder_short()}
        </span>
        <span className="hidden items-center gap-0.5 sm:flex">
          <Kbd>{isMac() ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="bg-foreground/15 fixed inset-0 z-50 backdrop-blur-xs transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-20">
          <Dialog.Popup
            aria-label={m.search_docs()}
            className="bg-card shadow-pop flex max-h-[min(34rem,80vh)] w-full max-w-xl flex-col overflow-hidden rounded-2xl transition duration-200 ease-out data-ending-style:-translate-y-2 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:-translate-y-2 data-starting-style:scale-[0.98] data-starting-style:opacity-0"
          >
            <Autocomplete.Root
              autoHighlight="always"
              filter={null}
              inline
              itemToStringValue={(row: Row) => row.content}
              items={results}
              keepHighlight
              onValueChange={search}
              open
              value={query}
            >
              <div className="border-border flex items-center gap-3 border-b px-4">
                {searching ? (
                  <LoaderCircle className="text-muted-foreground size-4.5 shrink-0 animate-spin" />
                ) : (
                  <SearchIcon className="text-muted-foreground size-4.5 shrink-0" />
                )}
                <Autocomplete.Input
                  aria-label={m.search_docs()}
                  className="placeholder:text-muted-foreground/70 h-14 w-full bg-transparent text-base outline-none"
                  placeholder={m.search_placeholder()}
                />
                <Dialog.Close className="shrink-0">
                  <Kbd>Esc</Kbd>
                </Dialog.Close>
              </div>

              <div className="min-h-0 flex-1 [scroll-padding-block:0.5rem] overflow-y-auto overscroll-contain p-2">
                <Autocomplete.Empty>
                  <p className="text-muted-foreground px-3 py-10 text-center text-sm">
                    {searching
                      ? m.search_searching()
                      : m.search_empty({ query })}
                  </p>
                </Autocomplete.Empty>
                <Autocomplete.List className="flex flex-col gap-px">
                  {(row: Row) => {
                    const Icon = icons[row.type];
                    const nested = row.type !== "page" && query !== "";
                    return (
                      <Autocomplete.Item
                        className={cn(
                          "group data-highlighted:bg-foreground/[0.05] flex cursor-default items-start gap-3 rounded-xl px-3 py-2.5 outline-none select-none",
                          nested && "ml-5"
                        )}
                        key={row.id}
                        onClick={() => {
                          go(row);
                        }}
                        value={row}
                      >
                        <Icon
                          className="text-muted-foreground mt-0.5 size-4 shrink-0"
                          strokeWidth={1.75}
                        />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span
                            className={cn(
                              "text-sm leading-snug",
                              row.type === "text"
                                ? "text-muted-foreground line-clamp-2"
                                : "font-medium"
                            )}
                          >
                            <Highlighted text={row.content} />
                          </span>
                          {row.type === "page" && row.trail !== undefined && (
                            <span className="text-muted-foreground text-xs">
                              {row.trail}
                            </span>
                          )}
                        </span>
                        <CornerDownLeft className="text-muted-foreground mt-0.5 size-3.5 shrink-0 opacity-0 group-data-highlighted:opacity-100" />
                      </Autocomplete.Item>
                    );
                  }}
                </Autocomplete.List>
              </div>

              <div className="border-border text-muted-foreground flex items-center gap-4 border-t px-4 py-2.5 text-xs">
                <span className="flex items-center gap-1.5">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  {m.search_hint_move()}
                </span>
                <span className="flex items-center gap-1.5">
                  <Kbd>↵</Kbd>
                  {m.search_hint_open()}
                </span>
              </div>
            </Autocomplete.Root>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
