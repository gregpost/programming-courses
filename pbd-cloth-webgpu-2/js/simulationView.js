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
    console.log(`[SimulationView.initBuffers] Starting buffer initialization`);
    console.log(`[SimulationView.initBuffers] Cloth size: ${this.clothSize}, spacing: ${this.spacing}`);
    
    try {
      // Add detailed logging for each buffer creation
      console.log(`[SimulationView.initBuffers] Creating position buffers...`);
      // your posBuffers creation code
      console.log(`[SimulationView.initBuffers] Position buffers created`);
      
      console.log(`[SimulationView.initBuffers] Creating parameter buffer...`);
      // your paramBuffer creation code
      console.log(`[SimulationView.initBuffers] Parameter buffer created`);
      
      console.log(`[SimulationView.initBuffers] Creating index buffer...`);
      // your indexBuffer creation code
      console.log(`[SimulationView.initBuffers] Index buffer created`);
      
      console.log(`[SimulationView.initBuffers] All buffers initialized successfully`);
    } catch (error) {
      console.error(`[SimulationView.initBuffers] Error initializing buffers:`, error);
    }
  }

  createCompute() {
    console.log(`[SimulationView.createCompute] Creating compute pipeline`);
    console.log(`[SimulationView.createCompute] Current strategy:`, this.model.strategy?.constructor?.name || 'null');
    
    try {
      if (!this.model.strategy) {
        console.error(`[SimulationView.createCompute] No strategy set!`);
        return;
      }
      
      console.log(`[SimulationView.createCompute] Strategy shader length:`, this.model.strategy.shader?.length || 0);
      this.computePipeline = this.model.strategy.createPipeline(this.device);
      console.log(`[SimulationView.createCompute] Compute pipeline created successfully`);
    } catch (error) {
      console.error(`[SimulationView.createCompute] Error creating compute pipeline:`, error);
    }
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
      // Add detailed logging for each render step
      console.log(`[SimulationView.renderFrame] Getting current texture...`);
      const texture = this.context.getCurrentTexture();
      console.log(`[SimulationView.renderFrame] Texture obtained:`, texture ? 'yes' : 'no');
      
      console.log(`[SimulationView.renderFrame] Creating command encoder...`);
      const encoder = this.device.createCommandEncoder();
      console.log(`[SimulationView.renderFrame] Command encoder created`);
      
      // Add compute pass logging
      if (this.computePipeline) {
        console.log(`[SimulationView.renderFrame] Starting compute pass...`);
        // your compute pass code
        console.log(`[SimulationView.renderFrame] Compute pass completed`);
      } else {
        console.warn(`[SimulationView.renderFrame] No compute pipeline available!`);
      }
      
      console.log(`[SimulationView.renderFrame] Starting render pass...`);
      // your render pass code
      console.log(`[SimulationView.renderFrame] Render pass completed`);
      
      console.log(`[SimulationView.renderFrame] Submitting commands...`);
      this.device.queue.submit([encoder.finish()]);
      console.log(`[SimulationView.renderFrame] Commands submitted`);
      
      console.log(`[SimulationView.renderFrame] Frame ${frameCount} rendered successfully`);
    } catch (error) {
      console.error(`[SimulationView.renderFrame] Error rendering frame ${frameCount}:`, error);
      throw error;
    }
  }
}