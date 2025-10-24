/* main.js
   Инициализация всей симуляции ткани через WebGPU
   Подгружает WGSL-шейдеры через fetch
   Использует GPUManager, PipelineFactory, стратегии и MVC
   Author: Grigoriy Postolskiy
   Date: 2025
*/

// 🔎 Check out the blog post:
// https://alain.xyz/blog/raw-webgpu

// 🟦 Shaders
const vertWgsl = `
struct VSOut {
    @builtin(position) Position: vec4<f32>,
    @location(0) color: vec3<f32>,
 };

@vertex
fn main(@location(0) inPos: vec3<f32>,
        @location(1) inColor: vec3<f32>) -> VSOut {
    var vsOut: VSOut;
    vsOut.Position = vec4<f32>(inPos, 1.0);
    vsOut.color = inColor;
    return vsOut;
}`;

const fragWgsl = `
@fragment
fn main(@location(0) inColor: vec3<f32>) -> @location(0) vec4<f32> {
    return vec4<f32>(inColor, 1.0);
}
`;

// 🌅 Renderer
// 📈 Position Vertex Buffer Data
const positions = new Float32Array([
    1.0, -1.0, 0.0,
   -1.0, -1.0, 0.0,
    0.0,  1.0, 0.0
]);

// 🎨 Color Vertex Buffer Data
const colors = new Float32Array([
    1.0, 0.0, 0.0, // 🔴
    0.0, 1.0, 0.0, // 🟢
    0.0, 0.0, 1.0  // 🔵
]);

// 📇 Index Buffer Data
const indices = new Uint16Array([ 0, 1, 2 ]);

class Renderer {
    canvas: HTMLCanvasElement;

    // ⚙️ API Data Structures
    adapter: GPUAdapter;
    device: GPUDevice;
    queue: GPUQueue;

    // 🎞️ Frame Backings
    context: GPUCanvasContext;
    colorTexture: GPUTexture;
    colorTextureView: GPUTextureView;
    depthTexture: GPUTexture;
    depthTextureView: GPUTextureView;

    // 🔺 Resources
    positionBuffer: GPUBuffer;
    colorBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    vertModule: GPUShaderModule;
    fragModule: GPUShaderModule;
    pipeline: GPURenderPipeline;

    commandEncoder: GPUCommandEncoder;
    passEncoder: GPURenderPassEncoder;

    constructor(canvas) {
        this.canvas = canvas;
    }

    // 🏎️ Start the rendering engine
    async start() {
        if (await this.initializeAPI()) {
            this.resizeBackings();
            await this.initializeResources();
            this.render();
        }
        else {
            canvas.style.display = "none";
            document.getElementById("error").innerHTML = `
<p>Doesn't look like your browser supports WebGPU.</p>
<p>Try using any chromium browser's canary build and go to <code>about:flags</code> to <code>enable-unsafe-webgpu</code>.</p>`
        }
    }

    // 🌟 Initialize WebGPU
    async initializeAPI(): Promise<boolean> {
        try {
            // 🏭 Entry to WebGPU
            const entry: GPU = navigator.gpu;
            if (!entry) {
                return false;
            }

            // 🔌 Physical Device Adapter
            this.adapter = await entry.requestAdapter();

            // 💻 Logical Device
            this.device = await this.adapter.requestDevice();

            // 📦 Queue
            this.queue = this.device.queue;
        } catch (e) {
            console.error(e);
            return false;
        }

        return true;
    }

    // 🍱 Initialize resources to render triangle (buffers, shaders, pipeline)
    async initializeResources() {
        // 🔺 Buffers
        let createBuffer = (arr: Float32Array | Uint16Array, usage: number) => {
            // 📏 Align to 4 bytes (thanks @chrimsonite)
            let desc = {
                size: (arr.byteLength + 3) & ~3,
                usage,
                mappedAtCreation: true
            };
            let buffer = this.device.createBuffer(desc);
            const writeArray =
                arr instanceof Uint16Array
                    ? new Uint16Array(buffer.getMappedRange())
                    : new Float32Array(buffer.getMappedRange());
            writeArray.set(arr);
            buffer.unmap();
            return buffer;
        };

        this.positionBuffer = createBuffer(positions, GPUBufferUsage.VERTEX);
        this.colorBuffer = createBuffer(colors, GPUBufferUsage.VERTEX);
        this.indexBuffer = createBuffer(indices, GPUBufferUsage.INDEX);

        // 🖍️ Shaders
        const vsmDesc: any = {
            code: vertWgsl
        };
        this.vertModule = this.device.createShaderModule(vsmDesc);

        const fsmDesc: any = {
            code: fragWgsl
        };
        this.fragModule = this.device.createShaderModule(fsmDesc);

        // ⚗️ Graphics Pipeline

        // 🔣 Input Assembly
        const positionAttribDesc: GPUVertexAttribute = {
            shaderLocation: 0, // [[attribute(0)]]
            offset: 0,
            format: 'float32x3'
        };
        const colorAttribDesc: GPUVertexAttribute = {
            shaderLocation: 1, // [[attribute(1)]]
            offset: 0,
            format: 'float32x3'
        };
        const positionBufferDesc: GPUVertexBufferLayout = {
            attributes: [positionAttribDesc],
            arrayStride: 4 * 3, // sizeof(float) * 3
            stepMode: 'vertex'
        };
        const colorBufferDesc: GPUVertexBufferLayout = {
            attributes: [colorAttribDesc],
            arrayStride: 4 * 3, // sizeof(float) * 3
            stepMode: 'vertex'
        };

        // 🌑 Depth
        const depthStencil: GPUDepthStencilState = {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus-stencil8'
        };

        // 🦄 Uniform Data
        const pipelineLayoutDesc = { bindGroupLayouts: [] };
        const layout = this.device.createPipelineLayout(pipelineLayoutDesc);

        // 🎭 Shader Stages
        const vertex: GPUVertexState = {
            module: this.vertModule,
            entryPoint: 'main',
            buffers: [positionBufferDesc, colorBufferDesc]
        };

        // 🌀 Color/Blend State
        const colorState: GPUColorTargetState = {
            format: 'bgra8unorm',
            writeMask: GPUColorWrite.ALL
        };

        const fragment: GPUFragmentState = {
            module: this.fragModule,
            entryPoint: 'main',
            targets: [colorState]
        };

        // 🟨 Rasterization
        const primitive: GPUPrimitiveState = {
            frontFace: 'cw',
            cullMode: 'none',
            topology: 'triangle-list'
        };

        const pipelineDesc: GPURenderPipelineDescriptor = {
            layout,

            vertex,
            fragment,

            primitive,
            depthStencil
        };
        this.pipeline = this.device.createRenderPipeline(pipelineDesc);
    }

    // ↙️ Resize Canvas, frame buffer attachments
    resizeBackings() {
        // ⛓️ Canvas Context
        if (!this.context) {
            this.context = this.canvas.getContext('webgpu');
            const canvasConfig: GPUCanvasConfiguration = {
                device: this.device,
                alphaMode: "opaque",
                format: 'bgra8unorm',
                usage:
                    GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
            };
            this.context.configure(canvasConfig);
        }

        const depthTextureDesc: GPUTextureDescriptor = {
            size: [this.canvas.width, this.canvas.height, 1],
            dimension: '2d',
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        };

        this.depthTexture = this.device.createTexture(depthTextureDesc);
        this.depthTextureView = this.depthTexture.createView();
    }

    // ✍️ Write commands to send to the GPU
    encodeCommands() {
        let colorAttachment: GPURenderPassColorAttachment = {
            view: this.colorTextureView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store'
        };

        const depthAttachment: GPURenderPassDepthStencilAttachment = {
            view: this.depthTextureView,
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            stencilClearValue: 0,
            stencilLoadOp: 'clear',
            stencilStoreOp: 'store',
        };


        const renderPassDesc: GPURenderPassDescriptor = {
            colorAttachments: [colorAttachment],
            depthStencilAttachment: depthAttachment
        };

        this.commandEncoder = this.device.createCommandEncoder();

        // 🖌️ Encode drawing commands
        this.passEncoder = this.commandEncoder.beginRenderPass(renderPassDesc);
        this.passEncoder.setPipeline(this.pipeline);
        this.passEncoder.setViewport(
            0,
            0,
            this.canvas.width,
            this.canvas.height,
            0,
            1
        );
        this.passEncoder.setScissorRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
        this.passEncoder.setVertexBuffer(0, this.positionBuffer);
        this.passEncoder.setVertexBuffer(1, this.colorBuffer);
        this.passEncoder.setIndexBuffer(this.indexBuffer, 'uint16');
        this.passEncoder.drawIndexed(3, 1);
        this.passEncoder.end();

        this.queue.submit([this.commandEncoder.finish()]);
    }

    render = () => {
        // ⏭ Acquire next image from context
        this.colorTexture = this.context.getCurrentTexture();
        this.colorTextureView = this.colorTexture.createView();

        // 📦 Write and submit commands to queue
        this.encodeCommands();

        // ➿ Refresh canvas
        requestAnimationFrame(this.render);
    };
}

// Main
const canvas = document.getElementById('gfx') as HTMLCanvasElement;
canvas.width = canvas.height = 640;
const renderer = new Renderer(canvas);
renderer.start();


/*
import { GPUManager } from "./gpuManager.js";
import { PBDStrategy, MassSpringStrategy } from "./strategies.js";
import { SimulationModel } from "./simulationModel.js";
import { SimulationView } from "./simulationView.js";
import { SimulationController } from "./simulationController.js";

// Функция для загрузки WGSL-шейдера через fetch
async function loadShader(path) {
  console.log(`[loadShader] Loading shader from path: ${path}`);
  const res = await fetch(path);
  if (!res.ok) {
    console.error(`[loadShader] Failed to load shader: ${path}`);
    throw new Error(`Failed to load shader: ${path}`);
  }
  const shader = await res.text();
  console.log(`[loadShader] Successfully loaded shader: ${path}, length: ${shader.length} chars`);
  return shader;
}

export async function initSimulation(canvas, gravityEl, strategyEl) {
  console.log(`[initSimulation] Starting simulation initialization`);
  
  if (!navigator.gpu) {
    console.error("[initSimulation] WebGPU not supported");
    alert("WebGPU не поддерживается");
    throw new Error("WebGPU not supported");
  }
  
  console.log("[initSimulation] WebGPU is supported");

  // Загружаем шейдеры
  console.log("[initSimulation] Loading shaders...");
  const [clothUpdatePBD, clothUpdateMassSpring, clothRenderWGSL] = await Promise.all([
    loadShader("./shaders/cloth_update_pbd.wgsl"),
    loadShader("./shaders/cloth_update_massspring.wgsl"),
    loadShader("./shaders/cloth_render.wgsl"),
  ]);
  console.log("[initSimulation] All shaders loaded successfully");

  console.log("[initSimulation] Getting GPUManager instance");
  const gpu = await GPUManager.getInstance(canvas);
  console.log("[initSimulation] GPUManager instance obtained");

  // Создаём стратегии с загруженными шейдерами
  console.log("[initSimulation] Creating PBD strategy");
  const pbdStrategy = new PBDStrategy(clothUpdatePBD);
  console.log("[initSimulation] Creating MassSpring strategy");
  const massSpringStrategy = new MassSpringStrategy(clothUpdateMassSpring);
  console.log("[initSimulation] Strategies created");

  console.log("[initSimulation] Creating SimulationModel");
  const model = new SimulationModel(gpu.device, gpu.format, pbdStrategy);
  console.log("[initSimulation] Creating SimulationView");
  const view = new SimulationView(gpu.device, gpu.context, gpu.format, model, clothRenderWGSL);
  console.log("[initSimulation] Creating SimulationController");
  const controller = new SimulationController(model, view);
  console.log("[initSimulation] MVC components created");

  console.log("[initSimulation] Setting up event listeners");
  gravityEl.addEventListener("change", () => {
    console.log(`[initSimulation] Gravity checkbox changed: ${gravityEl.checked}`);
    model.setGravity(gravityEl.checked);
  });
  
  strategyEl.addEventListener("change", () => {
    console.log(`[initSimulation] Strategy changed to: ${strategyEl.value}`);
    if (strategyEl.value === "pbd") {
      console.log("[initSimulation] Setting PBD strategy");
      model.setStrategy(pbdStrategy);
    } else {
      console.log("[initSimulation] Setting MassSpring strategy");
      model.setStrategy(massSpringStrategy);
    }
  });
  console.log("[initSimulation] Event listeners set up");

  console.log("[initSimulation] Starting controller");
  await controller.start();
  console.log("[initSimulation] Simulation initialization started");
}
*/