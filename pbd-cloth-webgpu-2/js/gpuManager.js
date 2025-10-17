// gpuManager.js
export class GPUManager {
  static instance;
  static async getInstance(canvas) {
    if (!GPUManager.instance) {
      const adapter = await navigator.gpu.requestAdapter();
      const device = await adapter.requestDevice();
      const context = canvas.getContext("webgpu");
      const format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({ device, format, alphaMode: "opaque" });
      GPUManager.instance = new GPUManager(device, context, format);
    }
    return GPUManager.instance;
  }
  constructor(device, context, format) {
    this.device = device;
    this.context = context;
    this.format = format;
  }
}
