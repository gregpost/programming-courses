/* main.js
   Инициализация всей симуляции ткани через WebGPU
   Использует GPUManager, PipelineFactory, стратегии и MVC
   Author: Grigoriy Postolskiy
   Date: 2025
*/

import { setupErrorHandler } from "./error_handler.js";
import { GPUManager } from "./gpuManager.js";
import { PBDStrategy, MassSpringStrategy } from "./strategies.js";
import { SimulationModel } from "./simulationModel.js";
import { SimulationView } from "./simulationView.js";
import { SimulationController } from "./simulationController.js";

// Настройка глобального вывода ошибок на страницу
setupErrorHandler();

export async function initSimulation(canvas, gravityEl, strategyEl) {
  if (!navigator.gpu) {
    alert("WebGPU не поддерживается");
    throw new Error("WebGPU not supported");
  }

  const gpu = await GPUManager.getInstance(canvas);
  const model = new SimulationModel(gpu.device, gpu.format);
  const view = new SimulationView(gpu.device, gpu.context, gpu.format, model);
  const controller = new SimulationController(model, view);

  gravityEl.addEventListener("change", () => model.setGravity(gravityEl.checked));
  strategyEl.addEventListener("change", () => {
    if (strategyEl.value === "pbd") model.setStrategy(new PBDStrategy());
    else model.setStrategy(new MassSpringStrategy());
  });

  controller.start();
}
