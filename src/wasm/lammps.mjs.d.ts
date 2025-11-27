import { AtomifyWasmModule } from './types';

interface EmscriptenModuleOptions {
  print?: (text: string) => void;
  printErr?: (text: string) => void;
}

declare function createModule(options?: EmscriptenModuleOptions): Promise<AtomifyWasmModule>;

export default createModule;

