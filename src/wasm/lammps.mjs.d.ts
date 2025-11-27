import { AtomifyWasmModule } from './types';

declare function createModule(options?: Partial<AtomifyWasmModule>): Promise<AtomifyWasmModule>;

export default createModule;

