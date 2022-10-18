import {Layout} from 'antd'
import Iframe from 'react-iframe'

const {Header} = Layout

const Analyze = () => {
  return (
    <>
    <div style={{height: '100vh', width: '100%'}}>
    <Iframe url="/atomify/package/index.html"
        width="100%"
        height="100%"
        id=""
        className=""
        display="block"
        position="relative"/>
    </div>
    </>
    )
}
export default Analyze