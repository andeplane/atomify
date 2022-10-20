import {useCallback, useState, useEffect} from 'react'
import { useMeasure } from 'react-use';
import { Select, Button, Divider } from 'antd';
import {Simulation, SimulationFile} from '../store/simulation'
import {useStoreActions, useStoreState} from '../hooks'
import { CaretRightOutlined, EditOutlined } from '@ant-design/icons';
import { Card, Layout, Skeleton, Row, Col, notification } from 'antd';
import {track} from '../utils/metrics'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

const {Option} = Select

const { Header } = Layout;
const { Meta } = Card;
interface Example {
  id: string
  title: string
  files: SimulationFile[]
  description: string
  analysisDescription?: string
  imageUrl: string
  inputScript: string
  author?: string,
  authorUrl?: string,
  keywords?: string[]
}

const Examples = () => {
  const [title, setTitle] = useState("Examples")
  const [description, setDescription] = useState<string>("")
  const [examples, setExamples] = useState<Example[]>([])
  const [filterKeywords, setFilterKeywords] = useState<string[]>([])
  const [myRef, { width }] = useMeasure<HTMLDivElement>();
  const setNewSimulation = useStoreActions(actions => actions.simulation.newSimulation)
  const simulation = useStoreState(state => state.simulation.simulation)
  const setPreferredView = useStoreActions(actions => actions.simulation.setPreferredView)
  const lammps = useStoreState(state => state.simulation.lammps)

  useEffect(() => {
    const fetchExamples = async(examplesUrl: string) => {
      let response = await fetch(examplesUrl, {cache: "no-store"})
      const data = await response.json()
      const baseUrl = data["baseUrl"]
      const title = data["title"] || "Examples"
      const descriptionsUrl = `${baseUrl}/${data["descriptionFile"]}`
      response = await fetch(descriptionsUrl)
      if (response.status !== 404) {
        const description = await response.text()
        setDescription(description)
      }
      
      const examples: Example[] = data["examples"]
      examples.forEach(example => {
        example.imageUrl = `${baseUrl}/${example.imageUrl}`
        example.files.forEach(file => {
          file.url = `${baseUrl}/${file.url}`
        })
      })

      setTitle(title)
      setExamples(data["examples"])
      track('Examples.Fetch', {examplesUrl})
    }

    (async () => {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlSearchParams.entries());

      let defaultExamplesUrl = 'examples/examples.json'
      let examplesUrl = defaultExamplesUrl
      if (params['examplesUrl'] != null) {
        examplesUrl = params['examplesUrl']
      }
      
      try {
        await fetchExamples(examplesUrl)
      } catch (e) {
        notification.error({message: `Could not fetch examples from ${examplesUrl}. Fetching default.`})
        await fetchExamples(defaultExamplesUrl)
      }
      
    })()
  }, [])

  const onPlay = useCallback((example: Example) => {
    track('Example.Run', {simulationId: example.id})
    const newSimulation: Simulation = {
      files: example.files,
      id: example.id,
      inputScript: example.inputScript,
      analysisDescription: example.analysisDescription,
      start: true
    }
    if (lammps?.getIsRunning()) {
      notification.info({
        message: 'Simulation already running',
        description: "You can't start a new simulation while another one is running.",
      });
    } else {
      setNewSimulation(newSimulation)
      setPreferredView('view')
    }
  }, [lammps, setNewSimulation, setPreferredView])

  const onEdit = useCallback((example: Example) => {
    track('Example.Edit', {simulationId: example.id})
    const newSimulation: Simulation = {
      files: example.files,
      id: example.id,
      inputScript: example.inputScript,
      start: false
    }
    if (simulation?.id !== newSimulation.id) {
      setNewSimulation(newSimulation)
    } else {
      setPreferredView('file'+newSimulation.inputScript)
    }
  }, [setNewSimulation, setPreferredView, simulation?.id])

  let keywordsSet: Set<string> = new Set()
  examples.forEach(example => {
    if (example.keywords) {
      example.keywords.forEach( (keyword) => keywordsSet.add(keyword) )
    }
  })
  const keywords = Array.from(keywordsSet)
  keywords.sort()

  const renderCard = (example: Example) => (
    <Card
      key={example.id}
      style={{ width: 300, marginLeft: 'auto', marginRight: 'auto' }}
      cover={
        <img
          alt="example"
          src={example.imageUrl}
        />
      }
      actions={[
        <CaretRightOutlined key="setting" onClick={() => onPlay(example)} />,
        <EditOutlined key="edit"  onClick={() => onEdit(example)} />,
      ]}
    >
      <Meta
        title={example.title}
        description={(
          <>
            {example.description} 
            <br />
            {example.author && 
              <>
              Author <Button type="link" href={example.authorUrl} target={"_blank"}>{example.author}</Button>
              </>
            }
          </>
        )
        }
      />
    </Card>
  )

  const renderChunk = (chunk: Example[], index: number) => (
    <Row key={index.toString()} gutter={8} justify="space-evenly">
      {chunk.map((example, index2) => (
        <Col key={index.toString()+index2.toString()} className="gutter-row" span={24/chunk.length} style={{marginTop: 10}}>
          {renderCard(example)}
        </Col>
      ))}
    </Row>
  )

  const chunkIt = (array: Example[], chunkSize: number) => {
    const chunks: Example[][] = []

    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        chunks.push(chunk)
    }
    return chunks
  }

  let filteredExamples: Example[] = []
  if (filterKeywords.length > 0) {
    filteredExamples = examples.filter(example => {
      let didFind = false
      if (example.keywords) {
        example.keywords.forEach(keyword => {
          if (filterKeywords.includes(keyword)) {
            didFind = true
          }
        })
      }
      return didFind
    })
  } else {
    filteredExamples = examples
  }
  const numChunks = Math.min(Math.max(1, Math.floor(width / 300)), 4)
  const chunks = chunkIt(filteredExamples, numChunks)

  return (
    <>
    <Header className="site-layout-background" style={{ fontSize: 25 }}>
      {title}
    </Header>
    <div style={{padding: 10, margin: 10}} ref={myRef}>
      <ReactMarkdown linkTarget="_blank" remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{description}</ReactMarkdown>
      <Divider />
      <Select
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Filter on example keywords"
          defaultValue={[]}
          onChange={setFilterKeywords}
        >
          {keywords.map(keyword => (
            <Option key={keyword}>{keyword}</Option>
          ))}
      </Select>
      {chunks.map(renderChunk)}
      {examples.length === 0 && <Skeleton active/>}
    </div>
    </>)
}
export default Examples