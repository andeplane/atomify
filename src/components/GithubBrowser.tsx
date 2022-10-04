import {useCallback, useEffect, useState} from 'react'
import {useListDirectory, retrievePath} from '../hooks/github'
import {useStoreActions, useStoreState} from '../hooks'
import {File} from '../store/files'
import {GithubFile} from '../types'
import { Tree, Spin } from 'antd';
import { EventDataNode } from "rc-tree/lib/interface";
const { DirectoryTree } = Tree;

interface GithubBrowserProps {
  user: string,
  repository: string,
  path: string
}

const GithubBrowser = ({user, repository, path}: GithubBrowserProps) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['examples'])
  const [treeData, setTreeData] = useState<GithubFile[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const tree = useStoreState(state => state.files.tree)
  const files = useStoreState(state => state.files.files)
  const setTree = useStoreActions(actions => actions.files.setTree)
  const setFiles = useStoreActions(actions => actions.files.setFiles)
  const setSelectedFile = useStoreActions(actions => actions.files.setSelectedFile)
  // const {isLoading, files_metadata} = useListDirectory(user, repository, path)

  useEffect( () => {
    (async () => {
      setLoading(true)
      let rootFiles = await retrievePath(user, repository, path)
      rootFiles = rootFiles.map(file => ({...file, isLeaf: file.type != 'dir'}))

      const root: GithubFile = {
        title: "examples",
        path: "examples", 
        download_url: undefined,
        size: 0,
        type: "dir",
        expanded: true,
        key: "examples",
        isLeaf: false,
        children: rootFiles
      }
      setTree([root])
      setLoading(false)
    })()
  }, [user, repository, path])
  
  const onSelect = useCallback( async (keys: React.Key[], info: any) => {
      const node: GithubFile = info.node
      if (node.download_url == null) {
        return
      }

      const downloadFile = async (path: string, fileName: string, url: string) => {
        const newFile: File = {
          loading: true,
          fileName: fileName,
          content: ""
        }
        let newFiles = {
          ...files
        }
        newFiles[path] = newFile
        setFiles(newFiles)
        const content = await fetch(url)
        newFile.content = await content.text();
        
        newFiles = {
          ...newFiles
        }
        newFiles[fileName] = newFile

        setFiles(newFiles)
      }

      if (!files[node.path]) {
        await downloadFile(node.path, node.title, node.download_url)
      }
      setSelectedFile(files[node.path])
  }, [files, setFiles, setSelectedFile]);
  
  const onExpand = useCallback( async (expandedKeys: React.Key[], {
    node,
    expanded,
    nativeEvent,
}: {
  node: EventDataNode<GithubFile>;
  expanded: boolean;
  nativeEvent: MouseEvent;
}) => {
    let files = await retrievePath(user, repository, node.path)
    files = files.map(file => ({...file, isLeaf: file.type != 'dir'}))
    const findNode = (path: string, node: GithubFile):(GithubFile|undefined) => {
      if (path == node.path) {
        return node
      }
      for (let i = 0; i < node.children.length; i++) {
        const foundIt = findNode( path, node.children[i])
        if (foundIt) {
          return foundIt
        }
      }
      
      return undefined
    }
    const nodeInTree = findNode(node.path, tree[0])
    if (nodeInTree) {
      nodeInTree.children = files
      nodeInTree.expanded = true
      setTree([{...tree[0]}])
    }
    setExpandedKeys(expandedKeys)
  }, [files, tree])

  return (
    <>
    {loading && <Spin />}
    {!loading && <DirectoryTree
      multiple
      expandedKeys={expandedKeys}
      onSelect={onSelect}
      onExpand={onExpand}
      treeData={tree}
    />}
    </>
  )
}
export default GithubBrowser