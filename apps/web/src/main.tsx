import "#/styles.css";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { getLocale } from "#/paraglide/runtime.js";
import { createAppRouter } from "#/router.tsx";

document.documentElement.lang = getLocale();

const router = createAppRouter();
const container = document.querySelector("#root");

if (!container) {
  throw new Error("Missing #root element");
}

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
