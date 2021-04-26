import React from 'react';
import { Tree } from 'antd';
const { DirectoryTree } = Tree;

interface TreeViewProps {
  files: string[],
  path: string
}

const onSelect = (keys: React.Key[], info: any) => {
  console.log('Trigger Select', keys, info);
};

const onExpand = () => {
  console.log('Trigger Expand');
};

const TreeView = ({files, path}: TreeViewProps) => {
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