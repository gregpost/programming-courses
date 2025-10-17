/**
 * ecs.js
 * ECS (Entity-Component-System) для симуляции.
 * Entity хранит компоненты, System обновляет сущности.
 * Пример системы: GravitySystem.
 * Позволяет добавлять новые физические эффекты без изменения существующего кода.
 */
export class Entity {
  constructor(components = {}) { this.components = components; }
  get(c) { return this.components[c]; }
  set(c, v) { this.components[c] = v; }
}

export class System { update(entities) {} }

export class GravitySystem extends System {
  constructor(enabled = true) { super(); this.enabled = enabled; }
  update(entities) {
    if (!this.enabled) return;
    entities.forEach(e => { if (e.get("velocity")) e.get("velocity").y -= 0.001; });
  }
}
