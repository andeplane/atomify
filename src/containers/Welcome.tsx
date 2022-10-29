import {Modal, Button, Checkbox} from 'antd'
import {useStoreActions} from '../hooks'
import styled from "styled-components";

interface WelcomeProps {
  onClose: () => void
}

const Welcome = ({onClose}: WelcomeProps) => {
  const setHideWelcome = useStoreActions(actions => actions.settings.setHideWelcome)
  return (
    <Modal className='welcome' open title={"Welcome to Atomify"} width={"60%"} onCancel={onClose} footer={[<>
      <Checkbox onChange={(e) => setHideWelcome(e.target.value)}>Don't show this again  </Checkbox>

      <Button onClick={onClose}>Ok</Button>
      </>
    ]}>
      Atomify is a molecular dynamics simulator in the browser with real time visualization, plotting and advanced analysis capabilities including Jupyter notebook support in the browser.
      It comes with a bunch of example simulations you can look at, or you can create your own. 
    </Modal>
  )
}

export default Welcome