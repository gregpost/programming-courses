/**
 * observable.js
 * Реализация простого Observer для связи UI и модели.
 * Позволяет подписываться на события и уведомлять слушателей.
 * Используется в SimulationModel и SimulationView.
 * Применяет паттерн Observer.
 */
export class Observable {
  /**
   * Конструктор создает новый экземпляр Observable с пустым списком слушателей
   * Инициализирует внутренний объект listeners для хранения событий и их обработчиков
   * Каждое событие будет храниться как ключ объекта с массивом callback-функций
   * Логирует создание экземпляра для отладки системы событий
   * Паттерн Observer позволяет реализовать слабую связь между компонентами системы
   */
  constructor() { 
    console.log(`[Observable.constructor] Creating new Observable instance`);
    this.listeners = {}; 
    console.log(`[Observable.constructor] Observable initialized with empty listeners`);
  }
  
  /**
   * Метод on позволяет подписаться на конкретное событие с callback-функцией
   * Создает новый массив слушателей для события, если он не существует
   * Добавляет callback-функцию в массив слушателей указанного события
   * Логирует процесс подписки для отслеживания связей между компонентами
   * Поддерживает множественную подписку - несколько обработчиков на одно событие
   * @param {string} event - Название события для подписки
   * @param {Function} cb - Callback-функция, вызываемая при наступлении события
   */
  on(event, cb) { 
    console.log(`[Observable.on] Adding listener for event: "${event}"`);
    if (!this.listeners[event]) {
      console.log(`[Observable.on] Creating new listener array for event: "${event}"`);
      this.listeners[event] = [];
    }
    this.listeners[event].push(cb);
    console.log(`[Observable.on] Listener added for event: "${event}", total listeners: ${this.listeners[event].length}`);
  }
  
  /**
   * Метод emit инициирует событие и уведомляет всех подписанных слушателей
   * Передает данные события каждому зарегистрированному callback-обработчику
   * Обрабатывает случаи отсутствия слушателей с предупреждающим сообщением
   * Обеспечивает безопасное выполнение callback-ов с обработкой исключений
   * Логирует весь процесс уведомления для отладки потока событий в системе
   * @param {string} event - Название события для инициации
   * @param {*} data - Данные, передаваемые слушателям события
   */
  emit(event, data) { 
    const listeners = this.listeners[event] || [];
    console.log(`[Observable.emit] Emitting event: "${event}" with data:`, data);
    console.log(`[Observable.emit] Found ${listeners.length} listeners for event: "${event}"`);
    
    if (listeners.length === 0) {
      console.warn(`[Observable.emit] No listeners registered for event: "${event}"`);
    }
    
    listeners.forEach((cb, index) => {
      console.log(`[Observable.emit] Calling listener ${index + 1}/${listeners.length} for event: "${event}"`);
      try {
        cb(data);
        console.log(`[Observable.emit] Listener ${index + 1} executed successfully`);
      } catch (error) {
        console.error(`[Observable.emit] Error in listener ${index + 1} for event "${event}":`, error);
      }
    });
    
    console.log(`[Observable.emit] Event: "${event}" completed, all listeners notified`);
  }
}
