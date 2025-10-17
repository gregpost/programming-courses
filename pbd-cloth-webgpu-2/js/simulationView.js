// simulationView.js
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
    const numVerts = this.clothSize * this.clothSize;
    const vertices = new Float32Array(numVerts * 4);
    let i = 0;
    for (let y = 0; y < this.clothSize; y++) {
      for (let x = 0; x < this.clothSize; x++) {
        const px = (x - this.clothSize / 2) * this.spacing;
        const py = 0;
        const pz = (y - this.clothSize / 2) * this.spacing;
        const fixed = (x === 0 && y === 0) || (x === this.clothSize - 1 && y === 0) ? 1 : 0;
        vertices.set([px, py, pz, fixed], i * 4);
        i++;
      }
    }
    this.posBuffers = [0, 1].map(() => this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX
    }));
    this.device.queue.writeBuffer(this.posBuffers[0], 0, vertices);

    this.paramBuffer = this.device.createBuffer({
      size: 4 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const indices = [];
    for (let y = 0; y < this.clothSize - 1; y++) {
      for (let x = 0; x < this.clothSize - 1; x++) {
        const i = y * this.clothSize + x;
        indices.push(i, i + 1, i + this.clothSize, i + 1, i + this.clothSize + 1, i + this.clothSize);
      }
    }
    this.indexData = new Uint32Array(indices);
    this.indexBuffer = this.device.createBuffer({
      size: this.indexData.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true
    });
    new Uint32Array(this.indexBuffer.getMappedRange()).set(this.indexData);
    this.indexBuffer.unmap();
  }

  createCompute() {
    this.computePipeline = this.model.strategy.createPipeline(this.device);
    this.bindGroups = [0, 1].map(i => this.device.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.paramBuffer } },
        { binding: 1, resource: { buffer: this.posBuffers[i] } },
        { binding: 2, resource: { buffer: this.posBuffers[(i + 1) % 2] } },
      ]
    }));
  }

  updateParams(time = 0) {
    this.device.queue.writeBuffer(this.paramBuffer, 0,
      new Float32Array([time, this.model.gravityEnabled ? 1 : 0, this.clothSize, this.spacing]));
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
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: [0.05, 0.05, 0.1, 1],
        storeOp: "store"
      }]
    });
    pass.setPipeline(this.renderPipeline);
    pass.setVertexBuffer(0, this.posBuffers[(frameCount + 1) % 2]);
    pass.setIndexBuffer(this.indexBuffer, "uint32");
    pass.drawIndexed(this.indexData.length);
    pass.end();

    this.device.queue.submit([encoder.finish()]);
  }
}
