import { render } from "@solidjs/web";
import { Errored, Loading } from "solid-js";

import "@my-app/ui/globals.css";
import { ThemeMenu } from "@my-app/ui/components/theme-menu";

import { Account } from "#src/account.tsx";
import { Router } from "#src/router.tsx";

const App = () => (
  <Router>
    {(route) => (
      <>
        <header class="flex justify-between border-b p-4">
          <nav class="flex gap-4">
            <a href={Router.paths()}>Home</a>
            <a href={Router.paths.about()}>About</a>
            <a href={Router.paths.todos()}>Todos</a>
          </nav>
          <div class="flex items-center gap-2">
            <Account />
            <ThemeMenu />
          </div>
        </header>
        <Errored
          fallback={(_error, reset) => (
            <main role="alert">
              Could not load this page.{" "}
              <button type="button" onClick={reset}>
                Retry
              </button>
            </main>
          )}
        >
          <Loading fallback={<main role="status">Loading…</main>}>
            {route.children}
          </Loading>
        </Errored>
      </>
    )}
  </Router>
);

const root = document.querySelector("#root");

if (!root) {
  throw new Error("Missing #root element");
}

render(App, root);
