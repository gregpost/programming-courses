import clothUpdatePBD from "./cloth_update_pbd.wgsl";
import clothUpdateMassSpring from "./cloth_update_massspring.wgsl";
import clothRenderWGSL from "./cloth_render.wgsl";

// ===== Singleton: GPUManager =====
class GPUManager {
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

// ===== Factory: создаёт пайплайны =====
class PipelineFactory {
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
          {
            arrayStride: 4 * 4,
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" },
              { shaderLocation: 1, offset: 12, format: "float32" },
            ],
          },
        ],
      },
      fragment: {
        module,
        entryPoint: "fs_main",
        targets: [{ format }],
      },
      primitive: { topology: "triangle-list" },
    });
  }
}

// ===== Strategy =====
class SimulationStrategy {
  constructor(shader) {
    this.shader = shader;
  }
  createPipeline(device) {
    return PipelineFactory.createComputePipeline(device, this.shader);
  }
}

class PBDStrategy extends SimulationStrategy {
  constructor() {
    super(clothUpdatePBD);
  }
}
class MassSpringStrategy extends SimulationStrategy {
  constructor() {
    super(clothUpdateMassSpring);
  }
}

// ===== Observer (подписка на UI) =====
class Observable {
  constructor() {
    this.listeners = {};
  }
  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }
  emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  }
}

// ===== ECS =====
class Entity {
  constructor(components = {}) {
    this.components = components;
  }
  get(c) { return this.components[c]; }
  set(c, v) { this.components[c] = v; }
}
class System {
  update(entities) {}
}
class GravitySystem extends System {
  constructor(enabled) {
    super();
    this.enabled = enabled;
  }
  update(entities) {
    entities.forEach(e => {
      if (this.enabled && e.get("velocity"))
        e.get("velocity").y -= 0.001;
    });
  }
}

// ===== MVC =====
class SimulationModel extends Observable {
  constructor(device, format) {
    super();
    this.device = device;
    this.format = format;
    this.strategy = new PBDStrategy();
    this.gravityEnabled = true;
    this.entities = [];
  }
  setStrategy(strategy) {
    this.strategy = strategy;
    this.emit("strategyChanged", strategy);
  }
  setGravity(enabled) {
    this.gravityEnabled = enabled;
    this.emit("gravityChanged", enabled);
  }
}

class SimulationView {
  constructor(device, context, format, model) {
    this.device = device;
    this.context = context;
    this.format = format;
    this.model = model;
    this.initBuffers();
    this.renderPipeline = PipelineFactory.createRenderPipeline(device, format);
    this.model.on("strategyChanged", () => this.createCompute());
    this.model.on("gravityChanged", () => this.updateParams());
    this.createCompute();
  }

  initBuffers() {
    const clothSize = 32, spacing = 0.05;
    const numVerts = clothSize * clothSize;
    const vertices = new Float32Array(numVerts * 4);
    let i = 0;
    for (let y = 0; y < clothSize; y++) {
      for (let x = 0; x < clothSize; x++) {
        const px = (x - clothSize / 2) * spacing;
        const py = 0.0;
        const pz = (y - clothSize / 2) * spacing;
        const fixed = (x === 0 && y === 0) || (x === clothSize - 1 && y === 0) ? 1.0 : 0.0;
        vertices.set([px, py, pz, fixed], i * 4);
        i++;
      }
    }
    this.posBuffers = [0, 1].map(() =>
      this.device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
      })
    );
    this.device.queue.writeBuffer(this.posBuffers[0], 0, vertices);
    this.paramBuffer = this.device.createBuffer({
      size: 4 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const indices = [];
    for (let y = 0; y < clothSize - 1; y++) {
      for (let x = 0; x < clothSize - 1; x++) {
        const i = y * clothSize + x;
        indices.push(i, i + 1, i + clothSize);
        indices.push(i + 1, i + clothSize + 1, i + clothSize);
      }
    }
    this.indexData = new Uint32Array(indices);
    this.indexBuffer = this.device.createBuffer({
      size: this.indexData.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });
    new Uint32Array(this.indexBuffer.getMappedRange()).set(this.indexData);
    this.indexBuffer.unmap();
    this.clothSize = clothSize;
    this.spacing = spacing;
  }

  createCompute() {
    this.computePipeline = this.model.strategy.createPipeline(this.device);
    this.bindGroups = [0, 1].map(i =>
      this.device.createBindGroup({
        layout: this.computePipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.paramBuffer } },
          { binding: 1, resource: { buffer: this.posBuffers[i] } },
          { binding: 2, resource: { buffer: this.posBuffers[(i + 1) % 2] } },
        ],
      })
    );
  }

  updateParams(time = 0) {
    this.device.queue.writeBuffer(
      this.paramBuffer,
      0,
      new Float32Array([time, this.model.gravityEnabled ? 1.0 : 0.0, this.clothSize, this.spacing])
    );
  }

  renderFrame(frameCount) {
    this.updateParams(frameCount * 0.016);
    const encoder = this.device.createCommandEncoder();
    const compute = encoder.beginComputePass();
    compute.setPipeline(this.computePipeline);
    compute.setBindGroup(0, this.bindGroups[frameCount % 2]);
    compute.dispatchWorkgroups(Math.ceil((this.clothSize * this.clothSize) / 64));
    compute.end();

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          loadOp: "clear",
          clearValue: [0.05, 0.05, 0.1, 1],
          storeOp: "store",
        },
      ],
    });
    pass.setPipeline(this.renderPipeline);
    pass.setVertexBuffer(0, this.posBuffers[(frameCount + 1) % 2]);
    pass.setIndexBuffer(this.indexBuffer, "uint32");
    pass.drawIndexed(this.indexData.length);
    pass.end();

    this.device.queue.submit([encoder.finish()]);
  }
}

class SimulationController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.frameCount = 0;
  }
  start() {
    const loop = () => {
      this.view.renderFrame(this.frameCount++);
      requestAnimationFrame(loop);
    };
    loop();
  }
}

// ===== main (инициализация) =====
if (!navigator.gpu) {
  alert("WebGPU не поддерживается");
  throw new Error("WebGPU not supported");
}

const canvas = document.getElementById("canvas");
const gravity = document.getElementById("gravity");
const strategySelect = document.getElementById("strategy");

const gpu = await GPUManager.getInstance(canvas);
const model = new SimulationModel(gpu.device, gpu.format);
const view = new SimulationView(gpu.device, gpu.context, gpu.format, model);
const controller = new SimulationController(model, view);

// Observer связывает UI с моделью
gravity.addEventListener("change", () => model.setGravity(gravity.checked));
strategySelect.addEventListener("change", () => {
  if (strategySelect.value === "pbd") model.setStrategy(new PBDStrategy());
  else model.setStrategy(new MassSpringStrategy());
});

controller.start();
