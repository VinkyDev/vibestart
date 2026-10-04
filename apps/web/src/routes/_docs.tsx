import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Sidebar } from "#/components/docs/sidebar.tsx";

const DocsLayout = () => (
  <div className="mx-auto flex w-full max-w-[88rem] flex-1">
    <Sidebar />
    <Outlet />
  </div>
);

export const Route = createFileRoute("/_docs")({
  component: DocsLayout,
});
