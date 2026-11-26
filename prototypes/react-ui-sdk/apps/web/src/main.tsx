import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Switch } from "@prototype/ui/components/switch";
import "@prototype/ui/globals.css";

function Appearance() {
  const [dark, setDark] = useState(false);
  return (
    <main data-theme={dark ? "dark" : "light"}>
      <section>
        <h1>Appearance</h1>
        <label>
          Dark mode
          <Switch checked={dark} onCheckedChange={setDark} />
        </label>
      </section>
    </main>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<Appearance />);
