# React UI SDK prototype

This static React 19 SPA imports a theme switch and its styles from a shared UI package. The switch uses the published UI SDK React adapter. The prototype exercises the component boundary ahead of its integration into the generator.

From this directory run `vp install` and `vp run dev`. Tab to **Dark mode** and press Space to change the theme.

Run `vp exec playwright install chromium` once, then `vp run ready` to check the workspace, build the SPA and exercise the switch against the production preview.
