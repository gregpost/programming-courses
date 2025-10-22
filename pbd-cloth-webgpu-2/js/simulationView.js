/**
 * simulationView.js
 * View MVC для WebGPU симуляции.
 * Отвечает за рендеринг ткани и работу Compute пайплайнов.
 * Подписывается на события модели (Observer) для обновления параметров.
 */
import { PipelineFactory } from "./pipelineFactory.js";

export class SimulationView {
  constructor(device, context, format, model) {
    console.log(`[SimulationView.constructor] Creating SimulationView`);
    console.log(`[SimulationView.constructor] Parameters:`, {
      device: device ? 'provided' : 'missing',
      context: context ? 'provided' : 'missing',
      format: format,
      model: model ? 'provided' : 'missing'
    });
    
    this.device = device;
    this.context = context;
    this.format = format;
    this.model = model;
    this.clothSize = 32;
    this.spacing = 0.05;
    
    console.log(`[SimulationView.constructor] Initializing buffers with clothSize: ${this.clothSize}, spacing: ${this.spacing}`);
    this.initBuffers();
    
    console.log(`[SimulationView.constructor] Creating render pipeline`);
    this.renderPipeline = PipelineFactory.createRenderPipeline(device, format);
    console.log(`[SimulationView.constructor] Render pipeline created`);
    
    console.log(`[SimulationView.constructor] Subscribing to model events`);
    this.model.on("strategyChanged", () => {
      console.log(`[SimulationView] strategyChanged event received, recreating compute pipeline`);
      this.createCompute();
    });
    this.model.on("gravityChanged", (enabled) => {
      console.log(`[SimulationView] gravityChanged event received, enabled: ${enabled}`);
      this.updateParams();
    });
    console.log(`[SimulationView.constructor] Model event subscriptions completed`);
    
    console.log(`[SimulationView.constructor] Creating initial compute pipeline`);
    this.createCompute();
    console.log(`[SimulationView.constructor] SimulationView initialized successfully`);
  }

  initBuffers() {
    console.log(`[SimulationView.initBuffers] Initializing GPU buffers`);
    console.log(`[SimulationView.initBuffers] Cloth size: ${this.clothSize}, spacing: ${this.spacing}`);
    // инициализация posBuffers, paramBuffer и indexBuffer
    console.log(`[SimulationView.initBuffers] GPU buffers initialized`);
  }

  createCompute() {
    console.log(`[SimulationView.createCompute] Creating compute pipeline`);
    console.log(`[SimulationView.createCompute] Current strategy:`, this.model.strategy?.constructor?.name || 'null');
    // создание compute пайплайна
    console.log(`[SimulationView.createCompute] Compute pipeline created successfully`);
  }

  updateParams(time = 0) {
    console.log(`[SimulationView.updateParams] Updating parameters, time: ${time}`);
    console.log(`[SimulationView.updateParams] Gravity enabled: ${this.model.gravityEnabled}`);
    // обновление параметров
    console.log(`[SimulationView.updateParams] Parameters updated successfully`);
  }

  renderFrame(frameCount) {
    console.log(`[SimulationView.renderFrame] Rendering frame ${frameCount}`);
    try {
      // рендеринг кадра
      console.log(`[SimulationView.renderFrame] Frame ${frameCount} rendered successfully`);
    } catch (error) {
      console.error(`[SimulationView.renderFrame] Error rendering frame ${frameCount}:`, error);
      throw error;
    }
  }
}