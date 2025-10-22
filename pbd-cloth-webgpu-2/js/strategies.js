/**
 * strategies.js
 * Strategy для выбора физической модели симуляции ткани.
 * Поддерживает PBD и Mass-Spring стратегии.
 * Каждая стратегия создаёт Compute пайплайн через PipelineFactory.
 * Применяет паттерн Strategy.
 */
import { PipelineFactory } from "./pipelineFactory.js";

export class SimulationStrategy {
  constructor(shader) { 
    console.log(`[SimulationStrategy.constructor] Creating SimulationStrategy`);
    console.log(`[SimulationStrategy.constructor] Shader length: ${shader?.length || 0} characters`);
    this.shader = shader; 
    console.log(`[SimulationStrategy.constructor] SimulationStrategy initialized`);
  }
  
  createPipeline(device) { 
    console.log(`[SimulationStrategy.createPipeline] Creating compute pipeline`);
    console.log(`[SimulationStrategy.createPipeline] Device: ${device ? 'provided' : 'missing'}`);
    console.log(`[SimulationStrategy.createPipeline] Strategy type: ${this.constructor.name}`);
    console.log(`[SimulationStrategy.createPipeline] Shader preview: ${this.shader?.substring(0, 100)}...`);
    
    const pipeline = PipelineFactory.createComputePipeline(device, this.shader);
    
    console.log(`[SimulationStrategy.createPipeline] Compute pipeline created successfully for ${this.constructor.name}`);
    return pipeline;
  }
}

export class PBDStrategy extends SimulationStrategy {
  constructor(shader) { 
    console.log(`[PBDStrategy.constructor] Creating PBDStrategy`);
    super(shader);
    console.log(`[PBDStrategy.constructor] PBDStrategy initialized`);
  }
}

export class MassSpringStrategy extends SimulationStrategy {
  constructor(shader) { 
    console.log(`[MassSpringStrategy.constructor] Creating MassSpringStrategy`);
    super(shader);
    console.log(`[MassSpringStrategy.constructor] MassSpringStrategy initialized`);
  }
}