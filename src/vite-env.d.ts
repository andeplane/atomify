/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot?: {
    readonly accept: (
      deps: string | string[],
      callback?: (modules: unknown) => void
    ) => void;
    readonly dispose: (callback: (data: unknown) => void) => void;
  };
}

