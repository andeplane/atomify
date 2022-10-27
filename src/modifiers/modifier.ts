import { ModifierInput, ModifierOutput } from './types'
import {StoreModel} from '../store/model'

interface ModifierProps {
  name: string
  active: boolean
}

abstract class Modifier {
  public name: string
  public active: boolean
  
  constructor({name, active}: ModifierProps) {
    this.name = name
    this.active = active
  }

  run = (state: StoreModel, input: ModifierInput, output: ModifierOutput) => {}
}
export default Modifier