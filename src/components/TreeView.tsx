import React from 'react';
import { Tree } from 'antd';
const { DirectoryTree } = Tree;

interface TreeViewProps {
  files: string[],
  path: string
  onSelect: (keys: React.Key[], info: any) => void
}

const onExpand = () => {
  console.log('Trigger Expand');
};

const TreeView = ({files, path, onSelect}: TreeViewProps) => {
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
    <DirectoryTree
      multiple
      defaultExpandAll
      onSelect={onSelect}
      onExpand={onExpand}
      treeData={treeData}
      
    />
  )
}
export default TreeView