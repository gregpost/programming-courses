/**
 * simulationView.js
 * View MVC для WebGPU симуляции.
 * Отвечает за рендеринг ткани и работу Compute пайплайнов.
 * Подписывается на события модели (Observer) для обновления параметров.
 */
import { PipelineFactory } from "./pipelineFactory.js";

export class SimulationView {
  constructor(device, context, format, model) {
    this.device = device;
    this.context = context;
    this.format = format;
    this.model = model;
    this.clothSize = 32;
    this.spacing = 0.05;
    this.initBuffers();
    this.renderPipeline = PipelineFactory.createRenderPipeline(device, format);
    this.model.on("strategyChanged", () => this.createCompute());
    this.model.on("gravityChanged", () => this.updateParams());
    this.createCompute();
  }

  initBuffers() {
    // инициализация posBuffers, paramBuffer и indexBuffer
  }

  createCompute() { /* создание compute пайплайна */ }

  updateParams(time = 0) { /* обновление параметров */ }

  renderFrame(frameCount) { /* рендеринг кадра */ }
}
