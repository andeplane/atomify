import { useCallback, useState, useEffect } from "react";
import { Select, Divider } from "antd";
import { Simulation } from "../store/simulation";
import { SimulationFile } from "../store/app";
import { useStoreActions, useStoreState } from "../hooks";
import { CaretRightOutlined, EditOutlined } from "@ant-design/icons";
import { Layout, Skeleton, notification } from "antd";
import { track } from "../utils/metrics";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeExternalLinks from "rehype-external-links";
import "katex/dist/katex.min.css";
import "./Examples.css";

const { Option } = Select;

const { Header } = Layout;
interface Example {
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

const Examples = () => {
  const [title, setTitle] = useState("Examples");
  const [description, setDescription] = useState<string>("");
  const [examples, setExamples] = useState<Example[]>([]);
  const [filterKeywords, setFilterKeywords] = useState<string[]>([]);
  // Width measurement no longer needed with CSS Grid
  const setNewSimulation = useStoreActions(
    (actions) => actions.simulation.newSimulation,
  );
  const simulation = useStoreState((state) => state.simulation.simulation);
  const running = useStoreState((state) => state.simulation.running);
  const setPreferredView = useStoreActions(
    (actions) => actions.app.setPreferredView,
  );

  useEffect(() => {
    const fetchExamples = async (examplesUrl: string) => {
      let response = await fetch(examplesUrl, { cache: "no-store" });
      const data = await response.json();
      const baseUrl = data["baseUrl"];
      const title = data["title"] || "Examples";
      const descriptionsUrl = `${baseUrl}/${data["descriptionFile"]}`;
      response = await fetch(descriptionsUrl);
      if (response.status !== 404) {
        const description = await response.text();
        setDescription(description);
      }

      const examples: Example[] = data["examples"];
      examples.forEach((example) => {
        example.imageUrl = `${baseUrl}/${example.imageUrl}`;
        example.files.forEach((file) => {
          file.url = `${baseUrl}/${file.url}`;
        });
      });

      setTitle(title);
      setExamples(data["examples"]);
      track("Examples.Fetch", { examplesUrl });
    };

    (async () => {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlSearchParams.entries());

      let defaultExamplesUrl = "examples/examples.json";
      let examplesUrl = defaultExamplesUrl;
      if (params["examplesUrl"] != null) {
        examplesUrl = params["examplesUrl"];
      }

      try {
        await fetchExamples(examplesUrl);
      } catch (e) {
        notification.error({
          message: `Could not fetch examples from ${examplesUrl}. Fetching default.`,
        });
        await fetchExamples(defaultExamplesUrl);
      }
    })();
  }, []);

  const onPlay = useCallback(
    (example: Example) => {
      track("Example.Run", { simulationId: example.id });
      const newSimulation: Simulation = {
        files: example.files,
        id: example.id,
        inputScript: example.inputScript,
        analysisDescription: example.analysisDescription,
        analysisScript: example.analysisScript,
        start: true,
      };
      if (running) {
        notification.info({
          message: "Simulation already running",
          description:
            "You can't start a new simulation while another one is running.",
        });
      } else {
        setNewSimulation(newSimulation);
        setPreferredView("view");
      }
    },
    [running, setNewSimulation, setPreferredView],
  );

  const onEdit = useCallback(
    (example: Example) => {
      track("Example.Edit", { simulationId: example.id });
      const newSimulation: Simulation = {
        files: example.files,
        id: example.id,
        inputScript: example.inputScript,
        start: false,
      };
      if (simulation?.id !== newSimulation.id) {
        setNewSimulation(newSimulation);
      } else {
        setPreferredView("file" + newSimulation.inputScript);
      }
    },
    [setNewSimulation, setPreferredView, simulation?.id],
  );

  let keywordsSet: Set<string> = new Set();
  examples.forEach((example) => {
    if (example.keywords) {
      example.keywords.forEach((keyword) => keywordsSet.add(keyword));
    }
  });
  const keywords = Array.from(keywordsSet);
  keywords.sort();

  const renderCard = (example: Example) => (
    <div 
      key={example.id} 
      className="modern-card"
      onClick={() => onPlay(example)}
    >
      <div className="card-image-container">
        <img
          alt={example.title}
          src={example.imageUrl}
          className="card-image"
        />
        <div className="card-overlay">
          <button 
            className="overlay-button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay(example);
            }}
            title="Run simulation"
          >
            <CaretRightOutlined />
          </button>
          <button 
            className="overlay-button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(example);
            }}
            title="Edit simulation"
          >
            <EditOutlined />
          </button>
        </div>
      </div>
      <div className="card-content">
        <div className="card-title" title={example.title}>{example.title}</div>
        <div className="card-description" title={example.description}>{example.description}</div>
        {example.author && (
          <div className="card-author">
            By <a 
              href={example.authorUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {example.author}
            </a>
          </div>
        )}
      </div>
    </div>
  );

  // No more chunking needed - CSS Grid handles responsive layout automatically

  let filteredExamples: Example[] = [];
  if (filterKeywords.length > 0) {
    filteredExamples = examples.filter((example) => {
      let didFind = false;
      if (example.keywords) {
        example.keywords.forEach((keyword) => {
          if (filterKeywords.includes(keyword)) {
            didFind = true;
          }
        });
      }
      return didFind;
    });
  } else {
    filteredExamples = examples;
  }

  return (
    <>
      <Header className="site-layout-background examples-header" style={{ fontSize: 25 }}>
        {title}
      </Header>
      <div className="examples-container">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[
            rehypeKatex,
            [rehypeExternalLinks, { target: "_blank", rel: ["nofollow", "noopener", "noreferrer"] }],
          ]}
        >
          {description}
        </ReactMarkdown>
        <Divider />
        <Select
          mode="multiple"
          allowClear
          style={{ width: "100%" }}
          placeholder="Filter on example keywords"
          defaultValue={[]}
          onChange={setFilterKeywords}
        >
          {keywords.map((keyword) => (
            <Option key={keyword}>{keyword}</Option>
          ))}
        </Select>
        <div className="cards-grid">
          {filteredExamples.map(renderCard)}
        </div>
        {examples.length === 0 && <Skeleton active />}
      </div>
    </>
  );
};
export default Examples;
