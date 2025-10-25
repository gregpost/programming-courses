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

/**
 * Загружает WGSL-шейдер из файла через Fetch API
 * @param {string} path - Путь к файлу шейдера
 * @returns {Promise<string>} Текст шейдера в формате WGSL
 * @throws {Error} Если загрузка не удалась
 * @example
 * const shader = await loadShader('./shaders/vertex.wgsl');
 */
async function loadShader(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load shader: ${path}`);
  return await res.text();
}

/**
 * Инициализирует всю симуляцию ткани: загружает шейдеры, создает GPU менеджер,
 * настраивает MVC компоненты и запускает основной цикл рендеринга
 * @param {HTMLCanvasElement} canvas - Canvas элемент для WebGPU рендеринга
 * @param {HTMLElement} gravityEl - Элемент управления гравитацией (чекбокс)
 * @param {HTMLElement} strategyEl - Элемент выбора стратегии симуляции (select)
 * @returns {Promise<void>}
 * @throws {Error} Если WebGPU не поддерживается или инициализация не удалась
 * @example
 * await initSimulation(canvas, gravityCheckbox, strategySelect);
 */
export async function initSimulation(canvas, gravityEl, strategyEl) {
  if (!navigator.gpu) {
    alert("WebGPU не поддерживается");
    throw new Error("WebGPU not supported");
  }

  // Параллельная загрузка всех шейдеров для оптимизации
  const [clothUpdatePBD, clothUpdateMassSpring, clothRenderWGSL] = await Promise.all([
    loadShader("./shaders/cloth_update_pbd.wgsl"),
    loadShader("./shaders/cloth_update_massspring.wgsl"),
    loadShader("./shaders/cloth_render.wgsl"),
  ]);

  /**
   * Инициализация GPU менеджера - центрального компонента для работы с WebGPU
   * Создает устройство, контекст и управляет ресурсами GPU
   */
  const gpu = await GPUManager.getInstance(canvas);

  // Создаём стратегии с загруженными шейдерами
  const pbdStrategy = new PBDStrategy(clothUpdatePBD);
  const massSpringStrategy = new MassSpringStrategy(clothUpdateMassSpring);

  /**
   * Модель симуляции - содержит состояние ткани, физические параметры
   * и активную стратегию обновления (PBD или Mass-Spring)
   */
  const model = new SimulationModel(gpu.device, gpu.format, pbdStrategy);

  /**
   * Представление - отвечает за визуализацию ткани через WebGPU,
   * создает пайплайны рендеринга и управляет вершинными буферами
   */
  const view = new SimulationView(gpu.device, gpu.context, gpu.format, model, clothRenderWGSL);

  /**
   * Контроллер - связывает модель и представление, управляет
   * основным циклом анимации и обработкой пользовательского ввода
   */
  const controller = new SimulationController(model, view);

  /**
   * Обработчик изменения состояния гравитации
   * Обновляет физическую модель в реальном времени
   */
  gravityEl.addEventListener("change", () => model.setGravity(gravityEl.checked));

  /**
   * Обработчик переключения между стратегиями симуляции
   * PBD (Position Based Dynamics) vs Mass-Spring система
   */
  strategyEl.addEventListener("change", () => {
    if (strategyEl.value === "pbd") model.setStrategy(pbdStrategy);
    else model.setStrategy(massSpringStrategy);
  });

  /**
   * Запуск основного цикла симуляции
   * Инициирует бесконечный цикл рендеринга и обновления физики
   */
  controller.start();
}
