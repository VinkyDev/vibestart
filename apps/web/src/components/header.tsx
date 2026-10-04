import { Link } from "@tanstack/react-router";

import { Search } from "#/components/docs/search.tsx";
import { Logo } from "#/components/logo.tsx";
import { Segmented } from "#/components/segmented.tsx";
import { repository } from "#/lib/site.ts";
import { m } from "#/paraglide/messages.js";
import { getLocale, locales, setLocale } from "#/paraglide/runtime.js";

const localeOptions = locales.map((locale) => ({
  label: { en: "EN", zh: "中文" }[locale],
  lang: locale,
  value: locale,
}));

const LocaleSwitch = () => (
  <Segmented
    id="locale"
    label={m.language()}
    onChange={(locale) => {
      void setLocale(locale);
    }}
    options={localeOptions}
    value={getLocale()}
  />
);

const GitHubMark = () => (
  <svg
    aria-hidden
    className="size-[18px]"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3" />
  </svg>
);

const navLink =
  "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] data-[status=active]:bg-foreground/[0.06] data-[status=active]:text-foreground focus-visible:ring-foreground/30 rounded-full px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2";

export const Header = () => (
  <header className="bg-background/80 supports-backdrop-filter:bg-background/65 h-header edge-on-scroll sticky top-0 z-40 flex shrink-0 items-center gap-2 px-4 backdrop-blur-md sm:gap-6 sm:px-6">
    <Link
      aria-label="vibestart"
      className="group/home focus-visible:ring-foreground/30 -m-1.5 flex shrink-0 items-center gap-2.5 rounded-full p-1.5 outline-none focus-visible:ring-2"
      to="/"
    >
      <Logo className="size-7 transition-transform duration-500 ease-out group-hover/home:-rotate-6" />
      <span className="text-ui hidden font-semibold tracking-tight min-[400px]:inline">
        vibestart
      </span>
      <span className="bg-foreground/5 text-muted-foreground hidden rounded-full px-2 py-0.5 text-xs md:inline">
        beta
      </span>
    </Link>
    <nav className="flex items-center gap-0.5 whitespace-nowrap">
      <Link className={navLink} params={{ _splat: "" }} to="/docs/$">
        {m.nav_docs()}
      </Link>
      <Link className={navLink} to="/studio">
        {m.nav_studio()}
      </Link>
    </nav>
    <div className="ml-auto flex items-center gap-2 sm:gap-3">
      <Search />
      <LocaleSwitch />
      {/* The narrowest phones leave it to the footer, so the bar fits without scrolling sideways. */}
      <a
        aria-label={m.github()}
        className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 focus-visible:ring-foreground/30 grid size-8 place-items-center rounded-full transition-colors outline-none focus-visible:ring-2 max-[359px]:hidden"
        href={repository}
        rel="noreferrer"
        target="_blank"
      >
        <GitHubMark />
      </a>
    </div>
  </header>
);
