/**
 * pipelineFactory.js
 * Factory для создания Compute и Render пайплайнов.
 * Используется для абстракции создания WebGPU пайплайнов.
 * Позволяет легко переключать шейдеры и формат канвы.
 * Применяет паттерн Factory.
 */
import clothRenderWGSL from "../shaders/cloth_render.wgsl";

export class PipelineFactory {
  static createComputePipeline(device, shaderCode) {
    return device.createComputePipeline({
      layout: "auto",
      compute: { module: device.createShaderModule({ code: shaderCode }), entryPoint: "main" },
    });
  }

  static createRenderPipeline(device, format) {
    const module = device.createShaderModule({ code: clothRenderWGSL });
    return device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module,
        entryPoint: "vs_main",
        buffers: [
          { arrayStride: 16, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }, { shaderLocation: 1, offset: 12, format: "float32" }] },
        ],
      },
      fragment: { module, entryPoint: "fs_main", targets: [{ format }] },
      primitive: { topology: "triangle-list" },
    });
  }
}
