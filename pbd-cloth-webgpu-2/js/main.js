/* main.js
   Инициализация всей симуляции ткани через WebGPU
   Подгружает WGSL-шейдеры через fetch
   Использует GPUManager, PipelineFactory, стратегии и MVC
   Author: Grigoriy Postolskiy
   Date: 2025
*/

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