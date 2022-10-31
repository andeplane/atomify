import {Layout} from 'antd'
import {useEffect, useState} from 'react'
import { useStoreState } from '../hooks';
const {Header} = Layout

const NewSimulation = () => {
  
  return (
    <>
      <Header className="site-layout-background" style={{ fontSize: 25 }}>
        New simulation
      </Header>
          
    </>
  )
}
export default NewSimulation