/**
 * pipelineFactory.js
 * Factory для создания Compute и Render пайплайнов.
 * Используется для абстракции создания WebGPU пайплайнов.
 * Позволяет легко переключать шейдеры и формат канвы.
 * Применяет паттерн Factory.
 */

export class PipelineFactory {
  static async loadShaderModule(device, url) {
    console.log(`[PipelineFactory.loadShaderModule] Loading shader module from: ${url}`);
    
    console.log(`[PipelineFactory.loadShaderModule] Fetching shader code`);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[PipelineFactory.loadShaderModule] Failed to fetch shader from ${url}: ${response.status}`);
      throw new Error(`Failed to fetch shader: ${url}`);
    }
    
    const code = await response.text();
    console.log(`[PipelineFactory.loadShaderModule] Shader code loaded, length: ${code.length} characters`);
    
    console.log(`[PipelineFactory.loadShaderModule] Creating shader module`);
    const shaderModule = device.createShaderModule({ code });
    console.log(`[PipelineFactory.loadShaderModule] Shader module created successfully`);
    
    return shaderModule;
  }

  static createComputePipeline(device, shaderCode) {
    console.log(`[PipelineFactory.createComputePipeline] Creating compute pipeline`);
    console.log(`[PipelineFactory.createComputePipeline] Shader code length: ${shaderCode.length} characters`);
    
    console.log(`[PipelineFactory.createComputePipeline] Creating shader module`);
    const shaderModule = device.createShaderModule({ code: shaderCode });
    console.log(`[PipelineFactory.createComputePipeline] Shader module created`);
    
    console.log(`[PipelineFactory.createComputePipeline] Setting up compute pipeline descriptor`);
    const pipelineDescriptor = {
      layout: "auto",
      compute: { 
        module: shaderModule, 
        entryPoint: "main" 
      },
    };
    
    console.log(`[PipelineFactory.createComputePipeline] Creating compute pipeline`);
    const pipeline = device.createComputePipeline(pipelineDescriptor);
    console.log(`[PipelineFactory.createComputePipeline] Compute pipeline created successfully`);
    
    return pipeline;
  }

  static async createRenderPipeline(device, format) {
    console.log(`[PipelineFactory.createRenderPipeline] Creating render pipeline with format: ${format}`);
    
    console.log(`[PipelineFactory.createRenderPipeline] Loading shader module`);
    const module = await PipelineFactory.loadShaderModule(device, "./shaders/cloth_render.wgsl");
    console.log(`[PipelineFactory.createRenderPipeline] Shader module loaded`);
    
    console.log(`[PipelineFactory.createRenderPipeline] Setting up render pipeline descriptor`);
    const pipelineDescriptor = {
      layout: "auto",
      vertex: {
        module,
        entryPoint: "vs_main",
        buffers: [
          { 
            arrayStride: 16, 
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" }, 
              { shaderLocation: 1, offset: 12, format: "float32" }
            ] 
          },
        ],
      },
      fragment: { 
        module, 
        entryPoint: "fs_main", 
        targets: [{ format }] 
      },
      primitive: { topology: "triangle-list" },
    };
    
    console.log(`[PipelineFactory.createRenderPipeline] Creating render pipeline`);
    const pipeline = device.createRenderPipeline(pipelineDescriptor);
    console.log(`[PipelineFactory.createRenderPipeline] Render pipeline created successfully`);
    
    return pipeline;
  }
}