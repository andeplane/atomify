// ESLint flat config. CI runs `npm run lint`, which fails on errors only;
// rules set to "warn" below are known violations that need non-trivial
// refactors to fix and are kept visible without blocking CI.
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "public",
      "node_modules",
      "coverage",
      "pypi",
      "jupyterlite",
      "cpp",
      "src/wasm",
      ".venv-jupyterlite",
      "test-results",
      "playwright-report",
      ".claude",
      "help/node_modules",
      "help/.vitepress/cache",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      // Only the two classic hooks rules; the plugin's React Compiler rules
      // are not enabled.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // `_`-prefixed parameters are intentionally unused (e.g. a modifier
      // override that ignores the base signature's `everything` flag).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // The one type-aware rule. Scoped to src/ (the tsconfig.json project)
    // so only app code pays for building a TypeScript program. Mark
    // intentionally fire-and-forget promises with `void`.
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
);
