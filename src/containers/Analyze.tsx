import Iframe from 'react-iframe'

const Analyze = () => {
  return (
    <>
      <div style={{height: '100vh', width: '100%'}}>
      <Iframe url="/atomify/jupyter/index.html"
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