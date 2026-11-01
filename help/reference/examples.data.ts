/**
 * Build-time data for the bundled-examples table: reads the app's own
 * public/examples/examples.json so the docs never drift from the library.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface ExampleFile {
  fileName: string;
  url?: string;
  content?: string;
}

interface RawExample {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  inputScript: string;
  analysisScript?: string;
  keywords?: string[];
  files?: ExampleFile[];
}

export interface BundledExample {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  inputScript: string;
  keywords: string[];
  multithreaded: boolean;
  notebook: boolean;
}

declare const data: BundledExample[];
export { data };

const here = dirname(fileURLToPath(import.meta.url));
const examplesDir = resolve(here, "../../public/examples");
const APP_EXAMPLES = "https://andeplane.github.io/atomify/examples/";

export default {
  watch: ["../../public/examples/examples.json"],
  load(): BundledExample[] {
    const json = JSON.parse(
      readFileSync(resolve(examplesDir, "examples.json"), "utf8"),
    ) as { examples: RawExample[] };
    return json.examples.map((example) => {
      const script = example.files?.find(
        (file) => file.fileName === example.inputScript,
      );
      let text = script?.content ?? "";
      if (script?.url) {
        const path = resolve(examplesDir, script.url);
        if (existsSync(path)) text = readFileSync(path, "utf8");
      }
      return {
        id: example.id,
        title: example.title,
        description: example.description,
        imageUrl: example.imageUrl ? APP_EXAMPLES + example.imageUrl : "",
        inputScript: example.inputScript,
        keywords: example.keywords ?? [],
        multithreaded: /^\s*suffix\s+kk\b/m.test(text),
        notebook: Boolean(example.analysisScript),
      };
    });
  },
};
