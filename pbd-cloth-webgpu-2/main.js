// main.js
import { GPUManager } from "./gpuManager.js";
import { SimulationModel } from "./simulationModel.js";
import { SimulationView } from "./simulationView.js";
import { SimulationController } from "./simulationController.js";
import { PBDStrategy, MassSpringStrategy } from "./strategies.js";

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
    model.setStrategy(strategyEl.value === "pbd" ? new PBDStrategy() : new MassSpringStrategy());
  });

  controller.start();
}
