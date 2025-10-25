/**
 * ecs.js
 * ECS (Entity-Component-System) для симуляции.
 * Entity хранит компоненты, System обновляет сущности.
 * Пример системы: GravitySystem.
 * Позволяет добавлять новые физические эффекты без изменения существующего кода.
 */

/**
 * Класс Entity представляет сущность в ECS-архитектуре
 * Каждая сущность содержит набор компонентов - данных, определяющих ее поведение
 * Компоненты хранятся как пары ключ-значение в объекте components
 * Сущности не содержат логики, только данные для обработки системами
 * @example
 * const entity = new Entity({position: {x: 0, y: 0}, velocity: {x: 1, y: 0}});
 */
export class Entity {
  /**
   * Создает новую сущность с указанными компонентами
   * Компоненты инициализируются переданным объектом или пустым объектом по умолчанию
   * Логирует процесс создания для отладки ECS-архитектуры
   * @param {Object} components - Начальные компоненты сущности {componentName: componentData}
   */
  constructor(components = {}) { 
    console.log(`[Entity.constructor] Creating entity with components:`, Object.keys(components));
    this.components = components; 
  }
  
  /**
   * Получает компонент сущности по имени класса/типа
   * Возвращает данные компонента или undefined если компонент не найден
   * Используется системами для доступа к данным сущностей во время обновления
   * @param {string|Function} c - Имя или класс компонента для получения
   * @returns {*} Данные компонента или undefined если не найден
   */
  get(c) { 
    console.log(`[Entity.get] Getting component: ${c}`, this.components[c] ? 'found' : 'not found');
    return this.components[c]; 
  }
  
  /**
   * Устанавливает или обновляет компонент сущности
   * Перезаписывает существующий компонент или создает новый
   * Позволяет динамически изменять состав сущностей во время выполнения
   * @param {string|Function} c - Имя или класс компонента для установки
   * @param {*} v - Данные компонента (объект, примитив, массив и т.д.)
   */
  set(c, v) { 
    console.log(`[Entity.set] Setting component: ${c} to:`, v);
    this.components[c] = v; 
  }
}

/**
 * Базовый класс System определяет интерфейс для систем в ECS-архитектуре
 * Системы содержат логику обработки сущностей с определенными компонентами
 * Каждая система отвечает за определенный аспект поведения (физика, рендеринг и т.д.)
 * Наследники должны переопределять update() метод для реализации специфической логики
 */
export class System { 
  /**
   * Основной метод обновления системы, вызывается каждый кадр симуляции
   * Базовая реализация только логирует вызов, должна быть переопределена наследниками
   * Фильтрует сущности по наличию необходимых компонентов и применяет к ним логику
   * @param {Entity[]} entities - Массив всех сущностей для обработки системой
   */
  update(entities) {
    console.log(`[System.update] Base system update called for ${entities.length} entities`);
  }
}

/**
 * GravitySystem реализует гравитационное воздействие на сущности
 * Наследуется от System и применяет гравитацию к сущностям с компонентом velocity
 * Может быть включена/отключена через свойство enabled для контроля физических эффектов
 * Работает независимо от других систем, демонстрируя модульность ECS-архитектуры
 */
export class GravitySystem extends System {
  /**
   * Создает систему гравитации с возможностью включения/отключения
   * Вызывает конструктор родительского класса System для правильной инициализации
   * @param {boolean} enabled - Флаг активности системы (true - включена, false - отключена)
   */
  constructor(enabled = true) { 
    super(); 
    console.log(`[GravitySystem.constructor] Creating GravitySystem, enabled: ${enabled}`);
    this.enabled = enabled; 
  }
  
  /**
   * Применяет гравитацию к сущностям с компонентом velocity
   * Если система отключена, немедленно завершает выполнение без обработки сущностей
   * Для каждой сущности с velocity уменьшает Y-компоненту скорости на фиксированную величину
   * Логирует детали выполнения для отладки физической симуляции
   * @param {Entity[]} entities - Массив сущностей для обработки гравитацией
   */
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
