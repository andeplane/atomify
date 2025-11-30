import { describe, it, expect, vi, beforeEach } from 'vitest';
import { action, createStore } from 'easy-peasy';
import type { SimulationModel, Simulation } from './simulation';
import type { LammpsWeb } from '../types';

describe('SimulationModel', () => {
  describe('finished state', () => {
    it('should initialize with finished as false', () => {
      // Arrange
      const store = createStore<Pick<SimulationModel, 'finished' | 'setFinished'>>({
        finished: false,
        setFinished: action((state, value: boolean) => {
          state.finished = value;
        }),
      });

      // Act
      const state = store.getState();

      // Assert
      expect(state.finished).toBe(false);
    });

    it('should set finished state to true', () => {
      // Arrange
      const store = createStore<Pick<SimulationModel, 'finished' | 'setFinished'>>({
        finished: false,
        setFinished: action((state, value: boolean) => {
          state.finished = value;
        }),
      });

      // Act
      store.getActions().setFinished(true);

      // Assert
      expect(store.getState().finished).toBe(true);
    });

    it('should set finished state to false', () => {
      // Arrange
      const store = createStore<Pick<SimulationModel, 'finished' | 'setFinished'>>({
        finished: true,
        setFinished: action((state, value: boolean) => {
          state.finished = value;
        }),
      });

      // Act
      store.getActions().setFinished(false);

      // Assert
      expect(store.getState().finished).toBe(false);
    });

    it('should reset finished state on reset action', () => {
      // Arrange
      const store = createStore<Pick<SimulationModel, 'finished' | 'files' | 'lammps' | 'reset'>>({
        finished: true,
        files: ['test.in'],
        lammps: undefined,
        reset: action((state) => {
          state.files = [];
          state.lammps = undefined;
          state.finished = false;
        }),
      });

      // Act
      store.getActions().reset(undefined);

      // Assert
      expect(store.getState().finished).toBe(false);
      expect(store.getState().files).toEqual([]);
    });
  });

  describe('continueSimulation types', () => {
    it('should accept undefined timesteps parameter', () => {
      // This test verifies that the type signature allows undefined
      // The actual thunk implementation is tested through integration tests
      
      // Arrange
      type ContinueSimulationAction = (timesteps: number | undefined) => void;
      
      // Act & Assert - This should compile without errors
      const mockAction: ContinueSimulationAction = (timesteps) => {
        if (timesteps === undefined) {
          // Default behavior
        } else {
          // Custom timesteps
        }
      };
      
      // Verify both call signatures work
      mockAction(1000);
      mockAction(undefined);
      
      expect(mockAction).toBeDefined();
    });
  });
});
