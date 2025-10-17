// observable.js
export class Observable {
  constructor() { this.listeners = {}; }
  on(event, cb) { (this.listeners[event] = this.listeners[event] || []).push(cb); }
  emit(event, data) { (this.listeners[event] || []).forEach(cb => cb(data)); }
}
