import { action, Action } from 'easy-peasy';
import Modifier from '../modifiers/modifier'
import SyncParticlesModifier from '../modifiers/syncparticles'
import SyncBondsModifier from '../modifiers/syncbonds'
// import ColorModifier from '../modifiers/colormodifier'

export interface ProcessingModel {
  postTimestepModifiers: Modifier[]
  setPostTimestepModifiers: Action<ProcessingModel, Modifier[]>
}

export const processingModel: ProcessingModel = {
  postTimestepModifiers: [
    new SyncParticlesModifier({
      name: 'Particles',
      active: true
    }),
    new SyncBondsModifier({
      name: 'Bonds',
      active: true
    }),
    // new ColorModifier({
    //   name: 'SyncBonds',
    //   computeName: 'peAtom'
    // })
  ],
  setPostTimestepModifiers: action((state, value: Modifier[]) => {
    state.postTimestepModifiers = value
  })
};