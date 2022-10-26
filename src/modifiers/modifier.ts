import { ModifierInput, ModifierOutput } from './types'
import {StoreModel} from '../store/model'

interface ModifierProps {
  name: string
}

abstract class Modifier {
  public name: string
  
  constructor({name}: ModifierProps) {
    this.name = name
  }

  run = (state: StoreModel, input: ModifierInput, output: ModifierOutput) => {}
}
export default Modifier