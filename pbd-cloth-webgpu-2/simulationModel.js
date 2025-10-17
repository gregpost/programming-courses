// simulationModel.js
import { Observable } from "./observable.js";

export class SimulationModel extends Observable {
  constructor(device, format) {
    super();
    this.device = device;
    this.format = format;
    this.strategy = null;
    this.gravityEnabled = true;
    this.entities = [];
  }
  setStrategy(strategy) { this.strategy = strategy; this.emit("strategyChanged", strategy); }
  setGravity(enabled) { this.gravityEnabled = enabled; this.emit("gravityChanged", enabled); }
}
