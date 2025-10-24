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
    console.log(`[SimulationView.constructor] Render pipeline created:`, this.renderPipeline);
    console.log(`[SimulationView.constructor] Render pipeline type:`, typeof this.renderPipeline);
    
    if (!this.renderPipeline) {
      console.error(`[SimulationView.constructor] CRITICAL: Render pipeline creation failed!`);
    } else {
      console.log(`[SimulationView.constructor] Render pipeline is valid`);
    }
    
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
      // Calculate expected vertex count
      const vertexCount = this.clothSize * this.clothSize;
      console.log(`[SimulationView.initBuffers] Expected vertex count: ${vertexCount}`);
      
      console.log(`[SimulationView.initBuffers] Creating position buffers...`);
      this.posBuffers = [
        this.device.createBuffer({
          size: vertexCount * 16, // 4 floats per vertex (x, y, z, w)
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        }),
        this.device.createBuffer({
          size: vertexCount * 16,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
      ];
      console.log(`[SimulationView.initBuffers] Position buffers created, size: ${vertexCount * 16} bytes each`);
      
      // Initialize with test data
      console.log(`[SimulationView.initBuffers] Initializing position buffers with test data...`);
      this.initializeClothVertices();
      
      console.log(`[SimulationView.initBuffers] Creating parameter buffer...`);
      this.paramBuffer = this.device.createBuffer({
        size: 16, // vec4 for parameters
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      console.log(`[SimulationView.initBuffers] Parameter buffer created, size: 16 bytes`);
      
      console.log(`[SimulationView.initBuffers] Creating index buffer...`);
      const indices = this.generateClothIndices();
      this.indexBuffer = this.device.createBuffer({
        size: indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });
      console.log(`[SimulationView.initBuffers] Index buffer created, ${indices.length} indices, ${indices.byteLength} bytes`);
      
      // Upload index data
      this.device.queue.writeBuffer(this.indexBuffer, 0, indices);
      console.log(`[SimulationView.initBuffers] Index data uploaded to GPU`);
      
      console.log(`[SimulationView.initBuffers] All buffers initialized successfully`);
    } catch (error) {
      console.error(`[SimulationView.initBuffers] Error initializing buffers:`, error);
    }
  }

  initializeClothVertices() {
    console.log(`[SimulationView.initializeClothVertices] Generating cloth vertex data`);
    const vertices = new Float32Array(this.clothSize * this.clothSize * 4);
    
    for (let y = 0; y < this.clothSize; y++) {
      for (let x = 0; x < this.clothSize; x++) {
        const i = (y * this.clothSize + x) * 4;
        vertices[i] = (x - this.clothSize / 2) * this.spacing;     // x
        vertices[i + 1] = (y - this.clothSize / 2) * this.spacing; // y  
        vertices[i + 2] = 0;                                       // z
        vertices[i + 3] = 1.0;                                     // w (mass)
      }
    }
    
    console.log(`[SimulationView.initializeClothVertices] Generated ${vertices.length / 4} vertices`);
    console.log(`[SimulationView.initializeClothVertices] First vertex: [${vertices[0]}, ${vertices[1]}, ${vertices[2]}, ${vertices[3]}]`);
    console.log(`[SimulationView.initializeClothVertices] Last vertex: [${vertices[vertices.length - 4]}, ${vertices[vertices.length - 3]}, ${vertices[vertices.length - 2]}, ${vertices[vertices.length - 1]}]`);
    
    // Upload to first position buffer
    this.device.queue.writeBuffer(this.posBuffers[0], 0, vertices);
    console.log(`[SimulationView.initializeClothVertices] Vertex data uploaded to GPU`);
  }

  generateClothIndices() {
    console.log(`[SimulationView.generateClothIndices] Generating cloth indices`);
    const indices = [];
    
    for (let y = 0; y < this.clothSize - 1; y++) {
      for (let x = 0; x < this.clothSize - 1; x++) {
        const tl = y * this.clothSize + x;
        const tr = tl + 1;
        const bl = (y + 1) * this.clothSize + x;
        const br = bl + 1;
        
        // First triangle
        indices.push(tl, tr, bl);
        // Second triangle  
        indices.push(tr, br, bl);
      }
    }
    
    console.log(`[SimulationView.generateClothIndices] Generated ${indices.length} indices`);
    console.log(`[SimulationView.generateClothIndices] First 6 indices: [${indices.slice(0, 6).join(', ')}]`);
    console.log(`[SimulationView.generateClothIndices] Last 6 indices: [${indices.slice(-6).join(', ')}]`);
    
    return new Uint16Array(indices);
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
      console.log(`[SimulationView.createCompute] Compute pipeline created:`, this.computePipeline);
      
      if (!this.computePipeline) {
        console.error(`[SimulationView.createCompute] Compute pipeline creation failed!`);
      } else {
        console.log(`[SimulationView.createCompute] Compute pipeline created successfully`);
      }
    } catch (error) {
      console.error(`[SimulationView.createCompute] Error creating compute pipeline:`, error);
    }
  }

  async updateParams(time = 0) {
    console.log(`[SimulationView.updateParams] Updating parameters, time: ${time}`);
    console.log(`[SimulationView.updateParams] Gravity enabled: ${this.model.gravityEnabled}`);
    // обновление параметров
    console.log(`[SimulationView.updateParams] Parameters updated successfully`);
  }

  async renderFrame(frameCount) {
    console.log(`[SimulationView.renderFrame] Rendering frame ${frameCount}`);
    console.log(`[SimulationView.renderFrame] Render pipeline:`, this.renderPipeline);
    
    // Critical check: skip rendering if pipeline is invalid - MUST BE FIRST!
    if (!this.renderPipeline) {
      console.error(`[SimulationView.renderFrame] CRITICAL: Render pipeline is null/undefined! Skipping frame.`);
      return;
    }
    
    try {
      console.log(`[SimulationView.renderFrame] Getting current texture...`);
      const texture = this.context.getCurrentTexture();
      console.log(`[SimulationView.renderFrame] Texture obtained:`, texture ? 'yes' : 'no');
      
      console.log(`[SimulationView.renderFrame] Creating command encoder...`);
      const encoder = this.device.createCommandEncoder();
      console.log(`[SimulationView.renderFrame] Command encoder created`);
      
      // Add compute pass logging
      if (this.computePipeline) {
        console.log(`[SimulationView.renderFrame] Starting compute pass...`);
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        // Add binding group setup if needed
        computePass.dispatchWorkgroups(Math.ceil(this.clothSize / 8), Math.ceil(this.clothSize / 8), 1);
        computePass.end();
        console.log(`[SimulationView.renderFrame] Compute pass completed`);
      } else {
        console.warn(`[SimulationView.renderFrame] No compute pipeline available!`);
      }
      
      console.log(`[SimulationView.renderFrame] Starting render pass...`);
      const renderPass = encoder.beginRenderPass({
        colorAttachments: [{
          view: texture.createView(),
          loadOp: "clear",
          storeOp: "store",
          clearValue: [0.1, 0.2, 0.3, 1], // Clear to blue-ish for visibility
        }],
      });
      
      const pipeline = await this.renderPipeline;

      console.log(`[SimulationView.renderFrame] Setting render pipeline...`);
      renderPass.setPipeline(pipeline); // This is line 229 where the error occurs
      
      console.log(`[SimulationView.renderFrame] Setting vertex buffer 0...`);
      renderPass.setVertexBuffer(0, this.posBuffers[0]);
      
      console.log(`[SimulationView.renderFrame] Setting index buffer...`);
      renderPass.setIndexBuffer(this.indexBuffer, "uint16");
      
      const indexCount = this.indexBuffer.size / 2; // Divide by 2 for uint16
      console.log(`[SimulationView.renderFrame] Drawing ${indexCount} indices...`);
      renderPass.drawIndexed(indexCount);
      
      renderPass.end();
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