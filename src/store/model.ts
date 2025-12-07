import { persist } from "easy-peasy";
import { type AppModel, appModel } from "./app";
import { type ProcessingModel, processingModel } from "./processing";
import { type RenderModel, renderModel } from "./render";
import { type SettingsModel, settingsModel } from "./settings";
import { type SimulationModel, simulationModel } from "./simulation";
import { type SimulationStatusModel, simulationStatusModel } from "./simulationstatus";

export interface StoreModel {
  simulation: SimulationModel;
  settings: SettingsModel;
  simulationStatus: SimulationStatusModel;
  processing: ProcessingModel;
  app: AppModel;
  render: RenderModel;
}

export const storeModel: StoreModel = {
  simulation: simulationModel,
  settings: persist(settingsModel),
  simulationStatus: simulationStatusModel,
  processing: processingModel,
  app: appModel,
  render: renderModel,
};
