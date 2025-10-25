/**
 * strategies.js
 * Strategy для выбора физической модели симуляции ткани.
 * Поддерживает PBD и Mass-Spring стратегии.
 * Каждая стратегия создаёт Compute пайплайн через PipelineFactory.
 * Применяет паттерн Strategy.
 */
import { PipelineFactory } from "./pipelineFactory.js";

/**
 * Базовый класс стратегии симуляции, определяющий общий интерфейс для физических моделей
 * Инкапсулирует WGSL-шейдер и механизм создания compute пайплайнов через фабрику
 * Реализует паттерн Strategy для динамического переключения алгоритмов симуляции
 * Позволяет добавлять новые физические модели без изменения существующего кода
 * Логирует процесс создания и компиляции шейдеров для отладки физических расчетов
 * Служит абстракцией над различными подходами к симуляции ткани: PBD, Mass-Spring и другими
 */
export class SimulationStrategy {
  /**
   * Создает базовую стратегию симуляции с указанным WGSL-шейдером
   * Инициализирует внутреннее состояние стратегии исходным кодом шейдера
   * Логирует длину шейдерного кода для проверки корректности загрузки
   * Подготавливает стратегию для последующего создания compute пайплайна
   * Базовый конструктор предназначен для наследования конкретными реализациями стратегий
   * @param {string} shader - Исходный код WGSL-шейдера для физических расчетов
   */
  constructor(shader) { 
    console.log(`[SimulationStrategy.constructor] Creating SimulationStrategy`);
    console.log(`[SimulationStrategy.constructor] Shader length: ${shader?.length || 0} characters`);
    this.shader = shader; 
    console.log(`[SimulationStrategy.constructor] SimulationStrategy initialized`);
  }
  
  /**
   * Создает compute пайплайн для выполнения физических расчетов на GPU
   * Делегирует создание пайплайна фабрике, передавая устройство и шейдерный код
   * Логирует тип стратегии и превью шейдера для диагностики процесса компиляции
   * Проверяет наличие GPU устройства перед созданием пайплайна
   * Обеспечивает единообразный интерфейс создания пайплайнов для всех стратегий
   * Возвращает готовый compute пайплайн для использования в цикле симуляции
   * @param {GPUDevice} device - WebGPU устройство для компиляции пайплайна
   * @returns {GPUComputePipeline} Скомпилированный compute пайплайн для физических расчетов
   */
  createPipeline(device) { 
    console.log(`[SimulationStrategy.createPipeline] Creating compute pipeline`);
    console.log(`[SimulationStrategy.createPipeline] Device: ${device ? 'provided' : 'missing'}`);
    console.log(`[SimulationStrategy.createPipeline] Strategy type: ${this.constructor.name}`);
    console.log(`[SimulationStrategy.createPipeline] Shader preview: ${this.shader?.substring(0, 100)}...`);
    
    const pipeline = PipelineFactory.createComputePipeline(device, this.shader);
    
    console.log(`[SimulationStrategy.createPipeline] Compute pipeline created successfully for ${this.constructor.name}`);
    return pipeline;
  }
}

/**
 * Стратегия Position-Based Dynamics (PBD) для симуляции ткани
 * Реализует современный подход к физической симуляции через прямые ограничения позиций
 * Наследует общий интерфейс базовой стратегии и специфичный PBD-шейдер
 * Особенно эффективна для стабильного моделирования тканей и деформируемых тел
 * Минимизирует растяжение и сохраняет объем лучше чем традиционные методы
 * Позволяет создавать реалистичные взаимодействия ткани с окружением
 * Обеспечивает визуально привлекательные результаты с минимальным tuning параметров
 */
export class PBDStrategy extends SimulationStrategy {
  /**
   * Создает стратегию PBD с специализированным шейдером для позиционно-ориентированной динамики
   * Вызывает родительский конструктор для инициализации общего состояния стратегии
   * Логирует создание конкретной реализации для отслеживания используемой физической модели
   * Наследует весь механизм создания пайплайнов от базового класса стратегии
   * Готовит стратегию для расчета ограничений расстояния и коллизий в реальном времени
   * @param {string} shader - Специализированный WGSL-шейдер с алгоритмами PBD
   */
  constructor(shader) { 
    console.log(`[PBDStrategy.constructor] Creating PBDStrategy`);
    super(shader);
    console.log(`[PBDStrategy.constructor] PBDStrategy initialized`);
  }
}

/**
 * Стратегия Mass-Spring системы для классической симуляции ткани
 * Реализует традиционный подход через систему масс, соединенных пружинами
 * Наследует базовую функциональность стратегии с масс-спринговым шейдером
 * Моделирует ткань как сетку точечных масс, соединенных пружинами различного типа
 * Позволяет тонко настраивать жесткость, демпфирование и другие физические параметры
 * Хорошо подходит для образовательных целей и случаев, требующих полного контроля над физикой
 * Обеспечивает классическое поведение ткани с реалистичными колебаниями и деформациями
 */
export class MassSpringStrategy extends SimulationStrategy {
  /**
   * Создает стратегию Mass-Spring с соответствующим шейдером для пружинной системы
   * Вызывает конструктор родительского класса для базовой инициализации
   * Логирует инициализацию масс-спринговой модели для диагностики системы
   * Наследует механизм создания compute пайплайнов без необходимости переопределения
   * Подготавливает стратегию для расчета сил пружин, гравитации и интеграции движения
   * @param {string} shader - Специализированный WGSL-шейдер с алгоритмами Mass-Spring системы
   */
  constructor(shader) { 
    console.log(`[MassSpringStrategy.constructor] Creating MassSpringStrategy`);
    super(shader);
    console.log(`[MassSpringStrategy.constructor] MassSpringStrategy initialized`);
  }
}
