import React from 'react';
import { Tree, Spin } from 'antd';
const { DirectoryTree } = Tree;

interface TreeViewProps {
  files: string[],
  path: string
  isLoading: boolean
  onSelect: (keys: React.Key[], info: any) => void
}

const onExpand = () => {
  console.log('Trigger Expand');
};

const TreeView = ({files, path, isLoading, onSelect}: TreeViewProps) => {
  const treeData = [{
    title: path,
    key: `parent`,
    children: files.map( (fileName, i) => (
      {
        title: fileName,
        key: `${i}`,
        isLeaf: true
      }
    ))
  }]
  
  return (
    <>
    {isLoading && <Spin />}
    {!isLoading && <DirectoryTree
      multiple
      defaultExpandAll
      onSelect={onSelect}
      onExpand={onExpand}
      treeData={treeData}
    />}
    </>
  )
}
export default TreeView