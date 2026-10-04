import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { MotionConfig } from "motion/react";

import { Header } from "#/components/header.tsx";
import { NotFound, notFoundAction } from "#/components/not-found.tsx";
import { m } from "#/paraglide/messages.js";

const RootLayout = () => (
  <MotionConfig reducedMotion="user">
    <HeadContent />
    <div className="flex min-h-svh flex-col">
      <Header />
      <Outlet />
    </div>
  </MotionConfig>
);

const PageNotFound = () => (
  <NotFound>
    <Link className={notFoundAction.primary} to="/">
      {m.not_found_home()}
    </Link>
    <Link
      className={notFoundAction.secondary}
      params={{ _splat: "" }}
      to="/docs/$"
    >
      {m.nav_docs()}
    </Link>
    <Link className={notFoundAction.secondary} to="/studio">
      {m.nav_studio()}
    </Link>
  </NotFound>
);

export const Route = createRootRoute({
  component: RootLayout,
  // The page's own title and description, in the reader's language; a deeper route's `head` wins.
  head: () => ({
    meta: [
      { title: m.document_title() },
      { content: m.document_description(), name: "description" },
    ],
  }),
  notFoundComponent: PageNotFound,
});
