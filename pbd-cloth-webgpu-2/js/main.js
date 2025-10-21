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
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load shader: ${path}`);
  return await res.text();
}

export async function initSimulation(canvas, gravityEl, strategyEl) {
  if (!navigator.gpu) {
    alert("WebGPU не поддерживается");
    throw new Error("WebGPU not supported");
  }

  // Загружаем шейдеры
 // const [clothUpdatePBD, clothUpdateMassSpring, clothRenderWGSL] = await Promise.all([
 //   loadShader("./shaders/cloth_update_pbd.wgsl"),
 //   loadShader("./shaders/cloth_update_massspring.wgsl"),
 //   loadShader("./shaders/cloth_render.wgsl"),
 // ]);

  const gpu = await GPUManager.getInstance(canvas);

  // Создаём стратегии с загруженными шейдерами
  const pbdStrategy = new PBDStrategy(clothUpdatePBD);
  const massSpringStrategy = new MassSpringStrategy(clothUpdateMassSpring);

  const model = new SimulationModel(gpu.device, gpu.format, pbdStrategy);
  const view = new SimulationView(gpu.device, gpu.context, gpu.format, model, clothRenderWGSL);
  const controller = new SimulationController(model, view);

  gravityEl.addEventListener("change", () => model.setGravity(gravityEl.checked));
  strategyEl.addEventListener("change", () => {
    if (strategyEl.value === "pbd") model.setStrategy(pbdStrategy);
    else model.setStrategy(massSpringStrategy);
  });

  controller.start();
}
