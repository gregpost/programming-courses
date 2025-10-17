/**
 * strategies.js
 * Strategy для выбора физической модели симуляции ткани.
 * Поддерживает PBD и Mass-Spring стратегии.
 * Каждая стратегия создаёт Compute пайплайн через PipelineFactory.
 * Применяет паттерн Strategy.
 */
import { PipelineFactory } from "./pipelineFactory.js";

export class SimulationStrategy {
  constructor(shader) { this.shader = shader; }
  createPipeline(device) { return PipelineFactory.createComputePipeline(device, this.shader); }
}

export class PBDStrategy extends SimulationStrategy {
  constructor(shader) { super(shader); }
}

export class MassSpringStrategy extends SimulationStrategy {
  constructor(shader) { super(shader); }
}
