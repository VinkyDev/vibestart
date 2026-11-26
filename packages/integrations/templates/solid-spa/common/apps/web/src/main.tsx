import { render } from "@solidjs/web";
import { Loading } from "solid-js";

import { ThemeMenu } from "@my-app/ui/components/theme-menu";
import "@my-app/ui/globals.css";

import { Router } from "#src/router.tsx";

const App = () => (
  <Router>
    {(route) => (
      <>
        <header class="flex justify-between border-b p-4">
          <nav class="flex gap-4">
            <a href={Router.paths()}>Home</a>
            <a href={Router.paths.about()}>About</a>
          </nav>
          <ThemeMenu />
        </header>
        <Loading fallback={<output>Loading…</output>}>{route.children}</Loading>
      </>
    )}
  </Router>
);

const root = document.querySelector("#root");

if (!root) {
  throw new Error("Missing #root element");
}

render(App, root);
