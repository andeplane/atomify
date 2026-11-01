import { defineConfig, type DefaultTheme } from "vitepress";

/**
 * Atomify Help: the user documentation, published next to the app at
 * https://andeplane.github.io/atomify/help/ (CI builds it into dist/help
 * after the app build). The app links here from the sidebar's Help button
 * (src/shell/helpUrl.ts), so treat page slugs as a public API: when you
 * rename a page, leave a stub at the old slug that links to the new one.
 */

const APP_URL = "https://andeplane.github.io/atomify/";

const sidebar: DefaultTheme.SidebarItem[] = [
  {
    text: "Getting started",
    items: [
      { text: "What is Atomify?", link: "/getting-started/what-is-atomify" },
      { text: "Browser requirements", link: "/getting-started/requirements" },
      { text: "Quick start", link: "/getting-started/quick-start" },
      {
        text: "A tour of the interface",
        link: "/getting-started/interface-tour",
      },
    ],
  },
  {
    text: "Tutorials",
    items: [
      { text: "Overview", link: "/tutorials/" },
      {
        text: "1. Watch your first simulation",
        link: "/tutorials/first-simulation",
      },
      { text: "2. Write your own script", link: "/tutorials/write-a-script" },
      {
        text: "3. Measure a diffusion coefficient",
        link: "/tutorials/measure-diffusion",
      },
      { text: "4. Sweep a parameter", link: "/tutorials/parameter-sweep" },
      {
        text: "5. Make a great-looking view",
        link: "/tutorials/visualize-a-system",
      },
      {
        text: "6. Share an example library",
        link: "/tutorials/example-library",
      },
    ],
  },
  {
    text: "How-to guides",
    items: [
      {
        text: "Projects and files",
        collapsed: false,
        items: [
          { text: "Create and manage projects", link: "/guide/projects" },
          { text: "Download, share and import", link: "/guide/import-export" },
          { text: "Manage files", link: "/guide/files" },
          { text: "Edit scripts", link: "/guide/editor" },
          { text: "View a data file", link: "/guide/data-files" },
        ],
      },
      {
        text: "Running",
        collapsed: false,
        items: [
          { text: "Run simulations", link: "/guide/runs" },
          { text: "Quick runs", link: "/guide/quick-runs" },
          { text: "Sweep parameters", link: "/guide/sweeps" },
          { text: "Continue a simulation", link: "/guide/continue-a-run" },
          { text: "Multithreading", link: "/guide/multithreading" },
        ],
      },
      {
        text: "Watching and visualizing",
        collapsed: false,
        items: [
          { text: "Watch a run", link: "/guide/watch-a-run" },
          { text: "Move the camera", link: "/guide/camera" },
          {
            text: "Atom colors, sizes and bonds",
            link: "/guide/atom-appearance",
          },
          { text: "Color atoms by a quantity", link: "/guide/color-atoms" },
          { text: "Slice", link: "/guide/slice" },
          { text: "Periodic images", link: "/guide/periodic-images" },
          { text: "Select atoms and measure", link: "/guide/select-atoms" },
          { text: "Rendering and lighting", link: "/guide/rendering" },
        ],
      },
      {
        text: "Analysis",
        collapsed: false,
        items: [
          { text: "Live plots", link: "/guide/live-plots" },
          { text: "Notebook analysis", link: "/guide/notebook" },
        ],
      },
      {
        text: "Examples and storage",
        collapsed: false,
        items: [
          { text: "Use the example library", link: "/guide/examples" },
          { text: "Load a custom library", link: "/guide/custom-library" },
          { text: "Manage browser storage", link: "/guide/storage" },
        ],
      },
    ],
  },
  {
    text: "Reference",
    collapsed: false,
    items: [
      { text: "Keyboard and mouse", link: "/reference/keyboard-shortcuts" },
      { text: "Script directives (#/)", link: "/reference/directives" },
      { text: "URL parameters", link: "/reference/url-parameters" },
      { text: "Settings", link: "/reference/settings" },
      { text: "Project and run folders", link: "/reference/run-directory" },
      { text: "examples.json format", link: "/reference/examples-json" },
      {
        text: "Tracked computes, fixes and variables",
        link: "/reference/tracked-quantities",
      },
      { text: "Units on plot axes", link: "/reference/units" },
      { text: "The LAMMPS engine", link: "/reference/lammps-engine" },
      { text: "Limits", link: "/reference/limits" },
      { text: "Bundled examples", link: "/reference/bundled-examples" },
      { text: "Glossary", link: "/reference/glossary" },
    ],
  },
  {
    text: "Concepts",
    collapsed: false,
    items: [
      { text: "Projects and runs", link: "/concepts/projects-and-runs" },
      {
        text: "Where your data lives",
        link: "/concepts/where-your-data-lives",
      },
      { text: "How simulations run", link: "/concepts/how-simulations-run" },
      {
        text: "Sync, speed and live analysis",
        link: "/concepts/sync-and-speed",
      },
    ],
  },
  {
    text: "FAQ and troubleshooting",
    collapsed: false,
    items: [
      { text: "FAQ", link: "/faq/" },
      { text: "Troubleshooting", link: "/faq/troubleshooting" },
      { text: "Known limitations", link: "/faq/known-limitations" },
      { text: "Getting help", link: "/faq/getting-help" },
    ],
  },
];

export default defineConfig({
  title: "Atomify Help",
  description:
    "Documentation and tutorials for Atomify: LAMMPS molecular dynamics in your browser.",
  base: "/atomify/help/",
  outDir: "../dist/help",
  cleanUrls: true,
  lastUpdated: true,
  // The app is dark by default; match it, with the usual toggle.
  appearance: "dark",
  head: [["link", { rel: "icon", href: "/atomify/favicon.ico" }]],
  markdown: {
    // LAMMPS has no Shiki grammar; `sh` highlights `#` comments and strings.
    languageAlias: { lammps: "sh" },
    math: false,
  },
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "Get started", link: "/getting-started/quick-start" },
      { text: "Tutorials", link: "/tutorials/" },
      { text: "Guides", link: "/guide/runs" },
      { text: "Reference", link: "/reference/keyboard-shortcuts" },
      { text: "Open Atomify", link: APP_URL, target: "_self" },
    ],
    sidebar,
    outline: { level: [2, 3], label: "On this page" },
    search: { provider: "local" },
    socialLinks: [
      { icon: "github", link: "https://github.com/andeplane/atomify" },
    ],
    editLink: {
      pattern: "https://github.com/andeplane/atomify/edit/main/help/:path",
      text: "Suggest a change to this page",
    },
    footer: {
      message:
        'Atomify is free and open source. Found a mistake? <a href="https://github.com/andeplane/atomify/issues">Open an issue</a>.',
      copyright: "Made by Anders Hafreager",
    },
  },
});
