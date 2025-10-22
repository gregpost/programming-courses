/**
 * ecs.js
 * ECS (Entity-Component-System) для симуляции.
 * Entity хранит компоненты, System обновляет сущности.
 * Пример системы: GravitySystem.
 * Позволяет добавлять новые физические эффекты без изменения существующего кода.
 */
export class Entity {
  constructor(components = {}) { 
    console.log(`[Entity.constructor] Creating entity with components:`, Object.keys(components));
    this.components = components; 
  }
  
  get(c) { 
    console.log(`[Entity.get] Getting component: ${c}`, this.components[c] ? 'found' : 'not found');
    return this.components[c]; 
  }
  
  set(c, v) { 
    console.log(`[Entity.set] Setting component: ${c} to:`, v);
    this.components[c] = v; 
  }
}

export class System { 
  update(entities) {
    console.log(`[System.update] Base system update called for ${entities.length} entities`);
  }
}

export class GravitySystem extends System {
  constructor(enabled = true) { 
    super(); 
    console.log(`[GravitySystem.constructor] Creating GravitySystem, enabled: ${enabled}`);
    this.enabled = enabled; 
  }
  
  update(entities) {
    console.log(`[GravitySystem.update] Updating ${entities.length} entities, enabled: ${this.enabled}`);
    
    if (!this.enabled) {
      console.log(`[GravitySystem.update] Gravity system disabled, skipping update`);
      return;
    }
    
    let velocityCount = 0;
    entities.forEach(e => { 
      if (e.get("velocity")) {
        const velocity = e.get("velocity");
        console.log(`[GravitySystem.update] Applying gravity to entity, current velocity:`, velocity);
        velocity.y -= 0.001;
        velocityCount++;
      }
    });
    
    console.log(`[GravitySystem.update] Gravity applied to ${velocityCount} entities with velocity component`);
  }
}