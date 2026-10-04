import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  FileCode2,
  Info,
  Lightbulb,
  Link2,
  TriangleAlert,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useRef } from "react";

import { cn } from "@vibestart/ui/lib/utils";

import { CopyGlyph, useCopy } from "#/components/copy.tsx";
import { DocLink } from "#/components/docs/doc-link.tsx";
import { m } from "#/paraglide/messages.js";

const Heading = ({
  as: Tag,
  children,
  className,
  id,
}: {
  readonly as: "h2" | "h3" | "h4";
  readonly children?: ReactNode;
  readonly className: string;
  readonly id?: string;
}) => (
  <Tag className={cn("group scroll-mt-24 lg:scroll-mt-8", className)} id={id}>
    {children}
    {id !== undefined && (
      <a
        aria-label={m.docs_anchor()}
        className="text-muted-foreground/0 group-hover:text-muted-foreground hover:text-foreground! focus-visible:text-foreground ml-2 inline-flex translate-y-[-0.1em] align-middle transition-colors"
        href={`#${id}`}
      >
        <Link2 className="size-[0.7em]" strokeWidth={2} />
      </a>
    )}
  </Tag>
);

const internal = ["/", "/studio"] as const;
const isInternal = (href: string): href is (typeof internal)[number] =>
  internal.some((path) => path === href);

const Anchor = ({ children, className, href = "" }: ComponentProps<"a">) => {
  const style = cn(
    "text-foreground decoration-foreground/25 hover:decoration-foreground font-medium underline underline-offset-4 transition-colors",
    className
  );
  if (href.startsWith("/docs")) {
    return (
      <DocLink className={style} url={href}>
        {children}
      </DocLink>
    );
  }
  if (isInternal(href)) {
    return (
      <Link className={style} to={href}>
        {children}
      </Link>
    );
  }
  if (href.startsWith("#")) {
    return (
      <a className={style} href={href}>
        {children}
      </a>
    );
  }
  return (
    <a
      className={cn(style, "group/link whitespace-nowrap")}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
      {/* Raised like a superscript, so the arrow marks the link without crowding the line. */}
      <ArrowUpRight
        className="text-muted-foreground group-hover/link:text-foreground ml-0.5 inline size-3 -translate-y-1.5 transition group-hover/link:translate-x-px group-hover/link:-translate-y-2"
        strokeWidth={2.25}
      />
    </a>
  );
};

const CodeBlock = ({
  children,
  title,
}: ComponentProps<"pre"> & { readonly title?: string }) => {
  const code = useRef<HTMLPreElement>(null);
  const { copied, copy } = useCopy();
  return (
    <figure className="bg-card shadow-rest group/code relative my-6 overflow-hidden rounded-xl">
      {title !== undefined && (
        <figcaption className="border-border text-muted-foreground flex items-center gap-2 border-b px-4 py-2.5 font-mono text-xs">
          <FileCode2 className="size-3.5" strokeWidth={1.75} />
          {title}
        </figcaption>
      )}
      <pre
        className="text-snippet leading-code [&>code]:text-snippet overflow-x-auto px-4 py-3.5 font-mono [&>code]:bg-transparent [&>code]:p-0"
        ref={code}
      >
        {children}
      </pre>
      <button
        aria-label={m.docs_copy_code()}
        className="bg-card text-muted-foreground hover:text-foreground shadow-rest absolute right-2.5 bottom-2.5 grid size-8 place-items-center rounded-lg opacity-100 transition-opacity focus-visible:opacity-100 sm:opacity-0 sm:group-hover/code:opacity-100"
        onClick={() => {
          void copy(code.current?.textContent ?? "");
        }}
        type="button"
      >
        <CopyGlyph copied={copied} />
      </button>
    </figure>
  );
};

const Table = ({ children }: ComponentProps<"table">) => (
  <div className="bg-card shadow-rest my-6 overflow-x-auto rounded-xl">
    <table className="w-full border-collapse text-left text-sm">
      {children}
    </table>
  </div>
);

export const proseComponents = {
  a: Anchor,
  blockquote: ({ children }: ComponentProps<"blockquote">) => (
    <blockquote className="border-foreground/15 text-muted-foreground my-6 border-l-2 pl-5 [&>p]:my-2">
      {children}
    </blockquote>
  ),
  code: ({ children }: ComponentProps<"code">) => (
    <code className="bg-foreground/[0.055] text-code rounded-md px-1.5 py-0.5 font-mono">
      {children}
    </code>
  ),
  h2: ({ children, id }: ComponentProps<"h2">) => (
    <Heading
      as="h2"
      className="border-border mt-14 mb-4 border-t pt-10 text-2xl leading-snug font-semibold tracking-tight"
      id={id}
    >
      {children}
    </Heading>
  ),
  h3: ({ children, id }: ComponentProps<"h3">) => (
    <Heading
      as="h3"
      className="mt-10 mb-3 text-lg font-semibold tracking-tight"
      id={id}
    >
      {children}
    </Heading>
  ),
  h4: ({ children, id }: ComponentProps<"h4">) => (
    <Heading as="h4" className="mt-8 mb-2 font-semibold" id={id}>
      {children}
    </Heading>
  ),
  hr: () => <hr className="border-border my-12" />,
  li: ({ children }: ComponentProps<"li">) => (
    <li className="marker:text-muted-foreground/60 pl-1.5 [&>p]:my-1">
      {children}
    </li>
  ),
  ol: ({ children }: ComponentProps<"ol">) => (
    <ol className="my-4 flex list-decimal flex-col gap-2 pl-5">{children}</ol>
  ),
  p: ({ children }: ComponentProps<"p">) => <p className="my-4">{children}</p>,
  pre: CodeBlock,
  strong: ({ children }: ComponentProps<"strong">) => (
    <strong className="text-foreground font-semibold">{children}</strong>
  ),
  table: Table,
  td: ({ children }: ComponentProps<"td">) => (
    <td className="border-border border-t px-4 py-3 align-top first:min-w-24">
      {children}
    </td>
  ),
  th: ({ children }: ComponentProps<"th">) => (
    <th className="text-muted-foreground bg-foreground/[0.025] px-4 py-2.5 text-xs font-medium whitespace-nowrap">
      {children}
    </th>
  ),
  ul: ({ children }: ComponentProps<"ul">) => (
    <ul className="my-4 flex list-disc flex-col gap-2 pl-5">{children}</ul>
  ),
};

const callouts = {
  note: { icon: Info, tint: "tint-framework" },
  tip: { icon: Lightbulb, tint: "tint-api" },
  warn: { icon: TriangleAlert, tint: "tint-database" },
} as const;

export const Callout = ({
  children,
  title,
  type = "note",
}: {
  readonly children: ReactNode;
  readonly title?: string;
  readonly type?: keyof typeof callouts;
}) => {
  const { icon: Icon, tint } = callouts[type];
  return (
    <aside
      className={cn(
        tint,
        "bg-card shadow-rest my-6 flex gap-3.5 rounded-xl px-5 py-4"
      )}
    >
      <span className="bg-tint-soft text-tint grid size-7 shrink-0 place-items-center rounded-lg">
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1 [&>p]:my-1.5 [&>p:first-child]:mt-0.5 [&>p:last-child]:mb-0">
        {title !== undefined && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </aside>
  );
};

export const Steps = ({ children }: { readonly children: ReactNode }) => (
  <ol className="my-8 flex flex-col [counter-reset:step]">{children}</ol>
);

export const Step = ({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) => (
  <li className="before:bg-foreground before:text-background after:bg-border relative pb-8 pl-12 [counter-increment:step] before:absolute before:top-0 before:left-0 before:grid before:size-7 before:place-items-center before:rounded-full before:font-mono before:text-xs before:content-[counter(step)] after:absolute after:top-9 after:bottom-1 after:left-[13.5px] after:w-px last:pb-0 last:after:hidden [&>p]:my-2">
    <p className="text-foreground mt-0.5 mb-2 font-semibold">{title}</p>
    {children}
  </li>
);

export const Cards = ({ children }: { readonly children: ReactNode }) => (
  <div className="my-8 grid gap-3 sm:grid-cols-2">{children}</div>
);

export const Card = ({
  children,
  href,
  title,
}: {
  readonly children?: ReactNode;
  readonly href: string;
  readonly title: string;
}) => (
  <DocLink
    className="bg-card shadow-rest hover:shadow-lift group flex flex-col gap-1.5 rounded-xl px-5 py-4 no-underline transition-shadow"
    url={href}
  >
    <span className="text-foreground flex items-center justify-between gap-3 font-medium">
      {title}
      <ArrowUpRight className="text-muted-foreground group-hover:text-foreground size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </span>
    {children !== undefined && (
      <div className="text-muted-foreground text-sm leading-relaxed [&>p]:my-0">
        {children}
      </div>
    )}
  </DocLink>
);
