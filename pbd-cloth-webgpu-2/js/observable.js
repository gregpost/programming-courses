/**
 * observable.js
 * Реализация простого Observer для связи UI и модели.
 * Позволяет подписываться на события и уведомлять слушателей.
 * Используется в SimulationModel и SimulationView.
 * Применяет паттерн Observer.
 */
export class Observable {
  constructor() { this.listeners = {}; }
  on(event, cb) { (this.listeners[event] = this.listeners[event] || []).push(cb); }
  emit(event, data) { (this.listeners[event] || []).forEach(cb => cb(data)); }
}
