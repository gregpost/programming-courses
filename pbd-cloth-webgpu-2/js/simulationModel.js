/**
 * simulationModel.js
 * Модель MVC для симуляции ткани.
 * Хранит текущее состояние, стратегию и флаги.
 * Использует Observable для уведомления View о изменениях.
 */
import { Observable } from "./observable.js";

export class SimulationModel extends Observable {
  /**
   * Конструктор создает модель симуляции ткани, наследуя от Observable для системы событий
   * Инициализирует все состояние симуляции: устройство GPU, формат, стратегию и флаги
   * Устанавливает начальные значения для гравитации и пустой массив сущностей ECS
   * Стратегия делается опциональной для гибкой конфигурации модели после создания
   * Логирует все параметры инициализации для отладки состояния модели при запуске
   * Модель выступает центральным хранилищем состояния в архитектуре MVC
   * @param {GPUDevice} device - WebGPU устройство для вычислений и рендеринга
   * @param {string} format - Графический формат для контекста отрисовки
   * @param {Object} strategy - Стратегия симуляции (PBD или Mass-Spring), опциональная
   */
  constructor(device, format, strategy = null) {  // ← Make strategy optional with default
    super();
    console.log(`[SimulationModel.constructor] Creating SimulationModel`);
    
    this.device = device;
    this.format = format;
    this.strategy = strategy;  // ← This was missing!
    this.gravityEnabled = true;
    this.entities = [];
    
    console.log(`[SimulationModel.constructor] SimulationModel initialized with:`, {
      device: device ? 'provided' : 'missing',
      format: format,
      strategy: this.strategy ? this.strategy.constructor.name : 'null', // ← Log strategy name
      gravityEnabled: this.gravityEnabled,
      entitiesCount: this.entities.length
    });
  }
  
  /**
   * Устанавливает новую стратегию симуляции ткани (PBD или Mass-Spring)
   * Заменяет текущую стратегию и уведомляет подписчиков через систему событий
   * Логирует тип предыдущей и новой стратегии для отслеживания изменений поведения
   * Генерирует событие "strategyChanged" для синхронизации представления с новой стратегией
   * Позволяет динамически переключать физические модели во время выполнения симуляции
   * Стратегия инкапсулирует алгоритмы обновления позиций частиц ткани
   * @param {Object} strategy - Новая стратегия симуляции, реализующая интерфейс обновления
   */
  setStrategy(strategy) { 
    console.log(`[SimulationModel.setStrategy] Setting new strategy:`, {
      strategyType: strategy?.constructor?.name || 'unknown',
      previousStrategy: this.strategy?.constructor?.name || 'null'
    });
    
    this.strategy = strategy; 
    
    console.log(`[SimulationModel.setStrategy] Emitting strategyChanged event`);
    this.emit("strategyChanged", strategy);
    console.log(`[SimulationModel.setStrategy] Strategy changed and event emitted`);
  }
  
  /**
   * Включает или отключает гравитацию в симуляции ткани
   * Изменяет флаг gravityEnabled и уведомляет подписчиков о изменении состояния
   * Логирует предыдущее и новое значение для отслеживания переходов состояния
   * Генерирует событие "gravityChanged" для обновления визуализации и физических расчетов
   * Позволяет экспериментировать с различными физическими условиями симуляции
   * Влияет на поведение системы гравитации в ECS-архитектуре приложения
   * @param {boolean} enabled - Флаг активности гравитации (true - включена, false - отключена)
   */
  setGravity(enabled) { 
    console.log(`[SimulationModel.setGravity] Setting gravity enabled: ${enabled} (was: ${this.gravityEnabled})`);
    
    this.gravityEnabled = enabled; 
    
    console.log(`[SimulationModel.setGravity] Emitting gravityChanged event`);
    this.emit("gravityChanged", enabled);
    console.log(`[SimulationModel.setGravity] Gravity changed and event emitted`);
  }
}
