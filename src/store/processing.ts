import { action, Action } from 'easy-peasy';
import Modifier from '../modifiers/modifier'
import SyncParticlesModifier from '../modifiers/syncparticles'

export interface ProcessingModel {
  postTimestepModifiers: Modifier[]
  setPostTimestepModifiers: Action<ProcessingModel, Modifier[]>
}

export const processingModel: ProcessingModel = {
  postTimestepModifiers: [
    new SyncParticlesModifier({
      name: 'SyncParticles'
    })
  ],
  setPostTimestepModifiers: action((state, value: Modifier[]) => {
    console.log("Setting value: ", value)
    state.postTimestepModifiers = value
  })
};