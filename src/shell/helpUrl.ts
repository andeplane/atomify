/**
 * Where the user documentation lives. The Help site is a separate static
 * site (built from help/ with VitePress) published next to the app, so it
 * is `<app base>/help/` both on GitHub Pages and under `vite preview`.
 */
export const HELP_URL = `${import.meta.env.BASE_URL}help/`;

/** Deep link to one page of the Help site, e.g. `helpPage("guide/runs")`. */
export const helpPage = (path: string) => `${HELP_URL}${path}`;
