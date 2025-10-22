/**
 * simulationModel.js
 * Модель MVC для симуляции ткани.
 * Хранит текущее состояние, стратегию и флаги.
 * Использует Observable для уведомления View о изменениях.
 */
import { Observable } from "./observable.js";

export class SimulationModel extends Observable {
  constructor(device, format) {
    console.log(`[SimulationModel.constructor] Creating SimulationModel`);
    super();
    console.log(`[SimulationModel.constructor] Observable base class initialized`);
    
    this.device = device;
    this.format = format;
    this.strategy = null;
    this.gravityEnabled = true;
    this.entities = [];
    
    console.log(`[SimulationModel.constructor] SimulationModel initialized with:`, {
      device: device ? 'provided' : 'missing',
      format: format,
      strategy: this.strategy ? 'set' : 'null',
      gravityEnabled: this.gravityEnabled,
      entitiesCount: this.entities.length
    });
  }
  
  setStrategy(strategy) { 
    console.log(`[SimulationModel.setStrategy] Setting new strategy:`, {
      strategyType: strategy?.constructor?.name || 'unknown',
      previousStrategy: this.strategy?.constructor?.name || 'null'
    });
    
    this.strategy = strategy; 
    
    console.log(`[SimulationModel.setStrategy] Emitting strategyChanged event`);
    this.emit("strategyChanged", strategy);
    console.log(`[SimulationModel.setStrategy] Strategy changed and event emitted`);
  }
  
  setGravity(enabled) { 
    console.log(`[SimulationModel.setGravity] Setting gravity enabled: ${enabled} (was: ${this.gravityEnabled})`);
    
    this.gravityEnabled = enabled; 
    
    console.log(`[SimulationModel.setGravity] Emitting gravityChanged event`);
    this.emit("gravityChanged", enabled);
    console.log(`[SimulationModel.setGravity] Gravity changed and event emitted`);
  }
}