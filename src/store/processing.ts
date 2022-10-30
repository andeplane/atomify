import { action, Action } from 'easy-peasy';
import Modifier from '../modifiers/modifier'
import SyncParticlesModifier from '../modifiers/syncparticlesmodifier'
import SyncBondsModifier from '../modifiers/syncbondsmodifier'
import ColorModifier from '../modifiers/colormodifier'
import SyncComputesModifier from '../modifiers/synccomputesmodifier';

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
    new ColorModifier({
      name: 'Colors',
      active: true
    }),
    new SyncComputesModifier({
      name: 'Computes',
      active: true
    })
  ],
  setPostTimestepModifiers: action((state, value: Modifier[]) => {
    state.postTimestepModifiers = value
  })
};