// strategies.js
import clothUpdatePBD from "./cloth_update_pbd.wgsl";
import clothUpdateMassSpring from "./cloth_update_massspring.wgsl";
import { PipelineFactory } from "./pipelineFactory.js";

export class SimulationStrategy {
  constructor(shader) { this.shader = shader; }
  createPipeline(device) { return PipelineFactory.createComputePipeline(device, this.shader); }
}

export class PBDStrategy extends SimulationStrategy { constructor() { super(clothUpdatePBD); } }
export class MassSpringStrategy extends SimulationStrategy { constructor() { super(clothUpdateMassSpring); } }

