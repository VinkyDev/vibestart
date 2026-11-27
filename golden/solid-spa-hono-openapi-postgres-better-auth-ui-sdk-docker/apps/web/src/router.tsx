import { createRouter } from "@solidjs/router";
import { lazy } from "solid-js";

import { Home } from "#src/home.tsx";

const About = () => (
  <main class="mx-auto grid max-w-3xl gap-4 px-6 py-16">
    <h1 class="text-4xl font-semibold">About my-app</h1>
    <p>Built with Solid 2, Solid Router and UI SDK.</p>
  </main>
);

const NotFound = () => (
  <main class="mx-auto max-w-3xl px-6 py-16">
    <h1 class="text-4xl font-semibold">Page not found</h1>
  </main>
);

export const Router = createRouter({
  routes: [
    { path: "/", component: Home },
    {
      path: "/login",
      component: lazy(async () => await import("#src/login.tsx"), {
        export: "Login",
      }),
    },
    {
      path: "/todos",
      component: lazy(async () => await import("#src/protected-todos.tsx"), {
        export: "ProtectedTodos",
      }),
    },
    { path: "/about", component: About },
    { path: "*missing", component: NotFound },
  ],
});
