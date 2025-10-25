/**
 * simulationController.js
 * Controller MVC для симуляции ткани.
 * Запускает анимационный цикл и обновляет View.
 * Применяет паттерн MVC.
 */
export class SimulationController {
  /**
   * Конструктор создает контроллер для управления симуляцией ткани по паттерну MVC
   * Инициализирует связь между моделью (данные) и представлением (визуализация)
   * Устанавливает счетчик кадров для отслеживания прогресса анимации
   * Проверяет наличие обязательных компонентов модели и представления
   * Логирует процесс создания контроллера для отладки архитектуры приложения
   * Контроллер выступает посредником, координирующим обновления между компонентами
   * @param {SimulationModel} model - Модель симуляции, содержащая данные и логику ткани
   * @param {SimulationView} view - Представление, отвечающее за визуализацию через WebGPU
   */
  constructor(model, view) {
    console.log(`[SimulationController.constructor] Creating SimulationController`);
    console.log(`[SimulationController.constructor] Model:`, model ? 'provided' : 'missing');
    console.log(`[SimulationController.constructor] View:`, view ? 'provided' : 'missing');
    
    this.model = model;
    this.view = view;
    this.frameCount = 0;
    
    console.log(`[SimulationController.constructor] SimulationController initialized with frameCount: ${this.frameCount}`);
  }
  
  /**
   * Запускает основной цикл анимации симуляции ткани через requestAnimationFrame
   * Создает рекурсивную функцию loop, которая вызывается для каждого кадра анимации
   * Координирует обновление представления и отслеживает количество отрисованных кадров
   * Обрабатывает ошибки рендеринга для предотвращения остановки всего цикла анимации
   * Логирует прогресс каждые 60 кадров для мониторинга производительности симуляции
   * Обеспечивает плавную анимацию с синхронизацией с частотой обновления дисплея
   * Использует WebGPU для высокопроизводительного рендеринга трехмерной ткани
   */
  async start() {
    console.log(`[SimulationController.start] Starting animation loop`);
    console.log(`[SimulationController.start] Initial frameCount: ${this.frameCount}`);
    
    const loop = () => {
      console.log(`[SimulationController.loop] Frame ${this.frameCount}: rendering frame`);
      
      try {
        this.view.renderFrame(this.frameCount);
        console.log(`[SimulationController.loop] Frame ${this.frameCount}: render completed successfully`);
      } catch (error) {
        console.error(`[SimulationController.loop] Frame ${this.frameCount}: render error:`, error);
      }
      
      this.frameCount++;
      
      if (this.frameCount % 60 === 0) {
        console.log(`[SimulationController.loop] Completed ${this.frameCount} frames`);
      }
      
      console.log(`[SimulationController.loop] Frame ${this.frameCount}: scheduling next frame`);
      requestAnimationFrame(loop);
    };
    
    console.log(`[SimulationController.start] Starting first animation frame`);
    loop();
    console.log(`[SimulationController.start] Animation loop started`);
  }
}
