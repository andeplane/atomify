import { SimulationModel, simulationModel } from "./simulation";
import { SettingsModel, settingsModel } from "./settings";
import {
  SimulationStatusModel,
  simulationStatusModel,
} from "./simulationstatus";
import { ProcessingModel, processingModel } from "./processing";
import { RenderModel, renderModel } from "./render";
import { AppModel, appModel } from "./app";
import { persist } from "easy-peasy";

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
