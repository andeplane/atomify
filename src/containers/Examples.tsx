import { useCallback, useState, useEffect } from "react";
import { Select, Button, Divider } from "antd";
import { Simulation } from "../store/simulation";
import { SimulationFile } from "../store/app";
import { useStoreActions, useStoreState } from "../hooks";
import { CaretRightOutlined, EditOutlined } from "@ant-design/icons";
import { Layout, Skeleton, notification } from "antd";
import { track } from "../utils/metrics";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Modern card styles with overlay design
const cardStyles = `
  .modern-card {
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s ease;
    border: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    background: white;
  }
  
  .modern-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  
  .card-image-container {
    position: relative;
    overflow: hidden;
    background: #f8f9fa;
  }
  
  .card-image {
    width: 100%;
    height: 180px;
    object-fit: cover;
    transition: transform 0.3s ease;
    cursor: pointer;
  }
  
  .card-image:hover {
    transform: scale(1.05);
  }
  
  .card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  
  .card-image-container:hover .card-overlay {
    opacity: 1;
  }
  
  .overlay-button {
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);
  }
  
  .overlay-button:hover {
    background: white;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .overlay-button .anticon {
    font-size: 18px;
    color: #333;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 8px;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .card-description {
    font-size: 13px;
    color: #666;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;
  }
  
  .card-author {
    font-size: 12px;
    color: #888;
    margin-top: 8px;
  }
  
  .card-author a {
    color: #1890ff;
    text-decoration: none;
    font-weight: 500;
  }
  
  .card-author a:hover {
    text-decoration: underline;
  }
  
  .cards-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    margin-top: 24px;
  }
  
  @media (max-width: 768px) {
    .cards-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
    }
    
    .card-image {
      height: 150px;
    }
  }
`;

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
      style={{ cursor: 'pointer' }}
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
        <div className="card-title">{example.title}</div>
        <div className="card-description">{example.description}</div>
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
      <style>{cardStyles}</style>
      <Header className="site-layout-background" style={{ fontSize: 25 }}>
        {title}
      </Header>
      <div style={{ padding: 16, margin: 10 }}>
        <ReactMarkdown
          linkTarget="_blank"
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
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
