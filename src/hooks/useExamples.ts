/**
 * Shared example-library data loading (extracted from containers/Examples.tsx
 * so the new shell's Home/Example screens reuse the same fetch + URL
 * resolution logic).
 */

import { useEffect, useState } from "react";
import type { SimulationFile } from "../store/app";
import { track } from "../utils/metrics";

export interface Example {
  id: string;
  title: string;
  files: SimulationFile[];
  description: string;
  analysisDescription?: string;
  imageUrl: string;
  inputScript: string;
  analysisScript?: string;
  author?: string;
  authorUrl?: string;
  keywords?: string[];
}

export interface ExamplesData {
  title: string;
  description: string;
  examples: Example[];
  loading: boolean;
  error?: string;
}

const DEFAULT_EXAMPLES_URL = "examples/examples.json";

async function fetchExamples(examplesUrl: string): Promise<{
  title: string;
  description: string;
  examples: Example[];
}> {
  let response = await fetch(examplesUrl, { cache: "no-store" });
  const data = await response.json();
  const baseUrl: string = data["baseUrl"];
  const title: string = data["title"] || "Examples";

  let description = "";
  const descriptionsUrl = `${baseUrl}/${data["descriptionFile"]}`;
  response = await fetch(descriptionsUrl);
  if (response.status !== 404) {
    description = await response.text();
  }

  const examples: Example[] = data["examples"];
  examples.forEach((example) => {
    example.imageUrl = `${baseUrl}/${example.imageUrl}`;
    if (example.analysisScript) {
      example.analysisScript = `${baseUrl}/${example.analysisScript}`;
    }
    example.files.forEach((file) => {
      if (file.url) {
        file.url = `${baseUrl}/${file.url}`;
      }
    });
  });

  track("Examples.Fetch", { examplesUrl });
  return { title, description, examples };
}

export function useExamples(): ExamplesData {
  const [state, setState] = useState<ExamplesData>({
    title: "Examples",
    description: "",
    examples: [],
    loading: true,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const examplesUrl = params.get("examplesUrl") ?? DEFAULT_EXAMPLES_URL;
      try {
        const data = await fetchExamples(examplesUrl);
        if (mounted) {
          setState({ ...data, loading: false });
        }
      } catch (error) {
        // Fall back to the bundled examples when a custom URL fails.
        try {
          const data = await fetchExamples(DEFAULT_EXAMPLES_URL);
          if (mounted) {
            setState({
              ...data,
              loading: false,
              error:
                examplesUrl === DEFAULT_EXAMPLES_URL
                  ? undefined
                  : `Could not fetch examples from ${examplesUrl}. Showing the defaults.`,
            });
          }
        } catch (fallbackError) {
          if (mounted) {
            setState((previous) => ({
              ...previous,
              loading: false,
              error: `Could not load the example library: ${
                fallbackError instanceof Error
                  ? fallbackError.message
                  : String(fallbackError)
              }`,
            }));
          }
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
