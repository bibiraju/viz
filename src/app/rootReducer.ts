import { combineReducers } from 'redux';

import { previousSimulations, activeSimulationConfig, simulationOutput } from './views/main/main-reducers';
import { mRIDs } from './views/topology/simulation-config-form-reducers';

export const rootReducer = combineReducers({
  activeSimulationConfig,
  previousSimulations,
  simulationOutput,
  mRIDs
});