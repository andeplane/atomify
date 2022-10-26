import { action, Action } from 'easy-peasy';
import Modifier from '../modifiers/modifier'
import SyncParticlesModifier from '../modifiers/syncparticles'
import SyncBondsModifier from '../modifiers/syncbonds'

export interface ProcessingModel {
  postTimestepModifiers: Modifier[]
  setPostTimestepModifiers: Action<ProcessingModel, Modifier[]>
}

export const processingModel: ProcessingModel = {
  postTimestepModifiers: [
    new SyncParticlesModifier({
      name: 'SyncParticles'
    }),
    new SyncBondsModifier({
      name: 'SyncBonds'
    })
  ],
  setPostTimestepModifiers: action((state, value: Modifier[]) => {
    state.postTimestepModifiers = value
  })
};