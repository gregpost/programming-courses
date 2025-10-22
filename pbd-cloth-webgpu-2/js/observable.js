/**
 * observable.js
 * Реализация простого Observer для связи UI и модели.
 * Позволяет подписываться на события и уведомлять слушателей.
 * Используется в SimulationModel и SimulationView.
 * Применяет паттерн Observer.
 */
export class Observable {
  constructor() { 
    console.log(`[Observable.constructor] Creating new Observable instance`);
    this.listeners = {}; 
    console.log(`[Observable.constructor] Observable initialized with empty listeners`);
  }
  
  on(event, cb) { 
    console.log(`[Observable.on] Adding listener for event: "${event}"`);
    if (!this.listeners[event]) {
      console.log(`[Observable.on] Creating new listener array for event: "${event}"`);
      this.listeners[event] = [];
    }
    this.listeners[event].push(cb);
    console.log(`[Observable.on] Listener added for event: "${event}", total listeners: ${this.listeners[event].length}`);
  }
  
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