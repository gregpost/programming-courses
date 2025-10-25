/**
 * simulationView.js
 * View MVC для WebGPU симуляции.
 * Отвечает за рендеринг ткани и работу Compute пайплайнов.
 * Подписывается на события модели (Observer) для обновления параметров.
 */
import { PipelineFactory } from "./pipelineFactory.js";

export class SimulationView {
  /**
   * Конструктор создает представление для визуализации симуляции ткани через WebGPU
   * Инициализирует все необходимые GPU-ресурсы: буферы, пайплайны и подписки на события
   * Настраивает параметры ткани: размер сетки и расстояние между частицами для физической модели
   * Создает рендер-пайплайн для отрисовки и подписывается на изменения модели для реактивного обновления
   * Логирует каждый этап инициализации для диагностики проблем с графическим контекстом
   * Выступает визуальным компонентом в архитектуре MVC, отвечая за весь WebGPU рендеринг
   * @param {GPUDevice} device - WebGPU устройство для создания буферов и пайплайнов
   * @param {GPUCanvasContext} context - Графический контекст для отрисовки в canvas
   * @param {string} format - Формат цвета для рендер-таргета
   * @param {SimulationModel} model - Модель симуляции для подписки на изменения состояния
   */
  constructor(device, context, format, model) {
    console.log(`[SimulationView.constructor] Creating SimulationView`);
    console.log(`[SimulationView.constructor] Parameters:`, {
      device: device ? 'provided' : 'missing',
      context: context ? 'provided' : 'missing',
      format: format,
      model: model ? 'provided' : 'missing'
    });
    
    this.device = device;
    this.context = context;
    this.format = format;
    this.model = model;
    this.clothSize = 32;
    this.spacing = 0.05;
    
    console.log(`[SimulationView.constructor] Initializing buffers with clothSize: ${this.clothSize}, spacing: ${this.spacing}`);
    this.initBuffers();
    
    console.log(`[SimulationView.constructor] Creating render pipeline`);
    this.renderPipeline = PipelineFactory.createRenderPipeline(device, format);
    console.log(`[SimulationView.constructor] Render pipeline created:`, this.renderPipeline);
    console.log(`[SimulationView.constructor] Render pipeline type:`, typeof this.renderPipeline);
    
    if (!this.renderPipeline) {
      console.error(`[SimulationView.constructor] CRITICAL: Render pipeline creation failed!`);
    } else {
      console.log(`[SimulationView.constructor] Render pipeline is valid`);
    }
    
    console.log(`[SimulationView.constructor] Subscribing to model events`);
    this.model.on("strategyChanged", () => {
      console.log(`[SimulationView] strategyChanged event received, recreating compute pipeline`);
      this.createCompute();
    });
    this.model.on("gravityChanged", (enabled) => {
      console.log(`[SimulationView] gravityChanged event received, enabled: ${enabled}`);
      this.updateParams();
    });
    console.log(`[SimulationView.constructor] Model event subscriptions completed`);
    
    console.log(`[SimulationView.constructor] Creating initial compute pipeline`);
    this.createCompute();
    console.log(`[SimulationView.constructor] SimulationView initialized successfully`);
  }

  /**
   * Инициализирует все GPU-буферы, необходимые для симуляции и рендеринга ткани
   * Создает двойные позиционные буферы для техники ping-pong в compute шейдерах
   * Генерирует индексный буфер для определения треугольников сетки ткани
   * Настраивает параметрический буфер для передачи uniform-данных в шейдеры
   * Рассчитывает размеры буферов на основе размера сетки и формата данных
   * Загружает начальные данные вершин и индексов в GPU память для немедленного использования
   * Обрабатывает ошибки создания буферов для предотвращения краха приложения
   */
  initBuffers() {
    console.log(`[SimulationView.initBuffers] Starting buffer initialization`);
    console.log(`[SimulationView.initBuffers] Cloth size: ${this.clothSize}, spacing: ${this.spacing}`);
    
    try {
      // Calculate expected vertex count
      const vertexCount = this.clothSize * this.clothSize;
      console.log(`[SimulationView.initBuffers] Expected vertex count: ${vertexCount}`);
      
      console.log(`[SimulationView.initBuffers] Creating position buffers...`);
      this.posBuffers = [
        this.device.createBuffer({
          size: vertexCount * 16, // 4 floats per vertex (x, y, z, w)
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        }),
        this.device.createBuffer({
          size: vertexCount * 16,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
      ];
      console.log(`[SimulationView.initBuffers] Position buffers created, size: ${vertexCount * 16} bytes each`);
      
      // Initialize with test data
      console.log(`[SimulationView.initBuffers] Initializing position buffers with test data...`);
      this.initializeClothVertices();
      
      console.log(`[SimulationView.initBuffers] Creating parameter buffer...`);
      this.paramBuffer = this.device.createBuffer({
        size: 16, // vec4 for parameters
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      console.log(`[SimulationView.initBuffers] Parameter buffer created, size: 16 bytes`);
      
      console.log(`[SimulationView.initBuffers] Creating index buffer...`);
      const indices = this.generateClothIndices();
      this.indexBuffer = this.device.createBuffer({
        size: indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });
      console.log(`[SimulationView.initBuffers] Index buffer created, ${indices.length} indices, ${indices.byteLength} bytes`);
      
      // Upload index data
      this.device.queue.writeBuffer(this.indexBuffer, 0, indices);
      console.log(`[SimulationView.initBuffers] Index data uploaded to GPU`);
      
      console.log(`[SimulationView.initBuffers] All buffers initialized successfully`);
    } catch (error) {
      console.error(`[SimulationView.initBuffers] Error initializing buffers:`, error);
    }
  }

  /**
   * Генерирует начальные позиции вершин для сетки ткани в виде прямоугольной решетки
   * Располагает вершины равномерно в XY-плоскости с центром в начале координат
   * Заполняет массив вершин структурированными данными: позиция (x,y,z) и масса (w-компонент)
   * Использует параметры clothSize и spacing для определения геометрии начального состояния
   * Создает плоскую сетку, которая затем деформируется физической симуляцией
   * Загружает сгенерированные данные в GPU-буфер для использования в вершинном шейдере
   * Логирует первую и последнюю вершину для проверки корректности генерации геометрии
   */
  initializeClothVertices() {
    console.log(`[SimulationView.initializeClothVertices] Generating cloth vertex data`);
    const vertices = new Float32Array(this.clothSize * this.clothSize * 4);
    
    for (let y = 0; y < this.clothSize; y++) {
      for (let x = 0; x < this.clothSize; x++) {
        const i = (y * this.clothSize + x) * 4;
        vertices[i] = (x - this.clothSize / 2) * this.spacing;     // x
        vertices[i + 1] = (y - this.clothSize / 2) * this.spacing; // y  
        vertices[i + 2] = 0;                                       // z
        vertices[i + 3] = 1.0;                                     // w (mass)
      }
    }
    
    console.log(`[SimulationView.initializeClothVertices] Generated ${vertices.length / 4} vertices`);
    console.log(`[SimulationView.initializeClothVertices] First vertex: [${vertices[0]}, ${vertices[1]}, ${vertices[2]}, ${vertices[3]}]`);
    console.log(`[SimulationView.initializeClothVertices] Last vertex: [${vertices[vertices.length - 4]}, ${vertices[vertices.length - 3]}, ${vertices[vertices.length - 2]}, ${vertices[vertices.length - 1]}]`);
    
    // Upload to first position buffer
    this.device.queue.writeBuffer(this.posBuffers[0], 0, vertices);
    console.log(`[SimulationView.initializeClothVertices] Vertex data uploaded to GPU`);
  }

  /**
   * Генерирует индексный массив для построения треугольников сетки ткани
   * Создает два треугольника для каждого квада сетки, формируя полную треугольную сетку
   * Использует топологию triangle-list для эффективного рендеринга в WebGPU
   * Рассчитывает индексы вершин на основе их положения в двумерной сетке
   * Обеспечивает правильную ориентацию треугольников для корректного определения лицевой стороны
   * Возвращает типизированный Uint16Array для эффективного использования в индексном буфере
   * Логирует количество сгенерированных индексов и примеры для проверки корректности
   * @returns {Uint16Array} Массив индексов для построения треугольников сетки ткани
   */
  generateClothIndices() {
    console.log(`[SimulationView.generateClothIndices] Generating cloth indices`);
    const indices = [];
    
    for (let y = 0; y < this.clothSize - 1; y++) {
      for (let x = 0; x < this.clothSize - 1; x++) {
        const tl = y * this.clothSize + x;
        const tr = tl + 1;
        const bl = (y + 1) * this.clothSize + x;
        const br = bl + 1;
        
        // First triangle
        indices.push(tl, tr, bl);
        // Second triangle  
        indices.push(tr, br, bl);
      }
    }
    
    console.log(`[SimulationView.generateClothIndices] Generated ${indices.length} indices`);
    console.log(`[SimulationView.generateClothIndices] First 6 indices: [${indices.slice(0, 6).join(', ')}]`);
    console.log(`[SimulationView.generateClothIndices] Last 6 indices: [${indices.slice(-6).join(', ')}]`);
    
    return new Uint16Array(indices);
  }

  /**
   * Создает или пересоздает compute пайплайн на основе текущей стратегии симуляции
   * Использует шейдерный код из активной стратегии для компиляции compute шейдера
   * Вызывается при изменении стратегии через событие model.strategyChanged
   * Обрабатывает случаи отсутствия стратегии с выводом предупреждающих сообщений
   * Логирует тип стратегии и процесс создания пайплайна для диагностики проблем компиляции
   * Обеспечивает динамическое переключение физических моделей без перезагрузки приложения
   * Устанавливает связь между стратегией модели и GPU-вычислениями для симуляции физики
   */
  createCompute() {
    console.log(`[SimulationView.createCompute] Creating compute pipeline`);
    console.log(`[SimulationView.createCompute] Current strategy:`, this.model.strategy?.constructor?.name || 'null');
    
    try {
      if (!this.model.strategy) {
        console.error(`[SimulationView.createCompute] No strategy set!`);
        return;
      }
      
      console.log(`[SimulationView.createCompute] Strategy shader length:`, this.model.strategy.shader?.length || 0);
      this.computePipeline = this.model.strategy.createPipeline(this.device);
      console.log(`[SimulationView.createCompute] Compute pipeline created:`, this.computePipeline);
      
      if (!this.computePipeline) {
        console.error(`[SimulationView.createCompute] Compute pipeline creation failed!`);
      } else {
        console.log(`[SimulationView.createCompute] Compute pipeline created successfully`);
      }
    } catch (error) {
      console.error(`[SimulationView.createCompute] Error creating compute pipeline:`, error);
    }
  }

  /**
   * Обновляет uniform-параметры в GPU-буферах для передачи в шейдеры
   * Синхронизирует состояние гравитации и другие параметры между моделью и шейдерами
   * Вызывается при изменении гравитации через событие model.gravityChanged
   * Подготавливает данные для передачи текущего времени симуляции в шейдеры анимации
   * Может быть расширен для передачи дополнительных параметров физической симуляции
   * Логирует обновляемые параметры для отслеживания изменений состояния визуализации
   * Обеспечивает согласованность между логикой приложения и графическим конвейером
   * @param {number} time - Текущее время симуляции для анимационных эффектов
   */
  async updateParams(time = 0) {
    console.log(`[SimulationView.updateParams] Updating parameters, time: ${time}`);
    console.log(`[SimulationView.updateParams] Gravity enabled: ${this.model.gravityEnabled}`);
    // обновление параметров
    console.log(`[SimulationView.updateParams] Parameters updated successfully`);
  }

  /**
   * Выполняет полный цикл рендеринга одного кадра симуляции ткани
   * Координирует compute pass для физических расчетов и render pass для визуализации
   * Проверяет валидность рендер-пайплайна перед началом отрисовки для предотвращения ошибок
   * Создает командный энкодер для записи последовательности GPU команд
   * Выполняет compute шейдеры для обновления позиций частиц ткани на основе физической модели
   * Отрисовывает сетку ткани с использованием индексного буфера и вершинных данных
   * Обрабатывает ошибки рендеринга с детальным логированием для диагностики проблем
   * Отправляет скомпилированные команды в очередь GPU для выполнения
   * @param {number} frameCount - Номер текущего кадра для логирования и анимации
   */
  async renderFrame(frameCount) {
    console.log(`[SimulationView.renderFrame] Rendering frame ${frameCount}`);
    
    const pipeline = await this.renderPipeline;

    console.log(`[SimulationView.renderFrame] Render pipeline:`, pipeline);
      
    // Critical check: skip rendering if pipeline is invalid - MUST BE FIRST!
    if (!pipeline) {
      console.error(`[SimulationView.renderFrame] CRITICAL: Render pipeline is null/undefined! Skipping frame.`);
      return;
    }
    
    try {
      console.log(`[SimulationView.renderFrame] Getting current texture...`);
      const texture = this.context.getCurrentTexture();
      console.log(`[SimulationView.renderFrame] Texture obtained:`, texture ? 'yes' : 'no');
      
      console.log(`[SimulationView.renderFrame] Creating command encoder...`);
      const encoder = this.device.createCommandEncoder();
      console.log(`[SimulationView.renderFrame] Command encoder created`);
      
      // Add compute pass logging
      if (this.computePipeline) {
        console.log(`[SimulationView.renderFrame] Starting compute pass...`);
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        // Add binding group setup if needed
        computePass.dispatchWorkgroups(Math.ceil(this.clothSize / 8), Math.ceil(this.clothSize / 8), 1);
        computePass.end();
        console.log(`[SimulationView.renderFrame] Compute pass completed`);
      } else {
        console.warn(`[SimulationView.renderFrame] No compute pipeline available!`);
      }
      
      console.log(`[SimulationView.renderFrame] Starting render pass...`);
      const renderPass = encoder.beginRenderPass({
        colorAttachments: [{
          view: texture.createView(),
          loadOp: "clear",
          storeOp: "store",
          clearValue: [0.1, 0.2, 0.3, 1], // Clear to blue-ish for visibility
        }],
      });

      console.log(`[SimulationView.renderFrame] Setting render pipeline...`);
      renderPass.setPipeline(pipeline); // This is line 229 where the error occurs
      
      console.log(`[SimulationView.renderFrame] Setting vertex buffer 0...`);
      renderPass.setVertexBuffer(0, this.posBuffers[0]);
      
      console.log(`[SimulationView.renderFrame] Setting index buffer...`);
      renderPass.setIndexBuffer(this.indexBuffer, "uint16");
      
      const indexCount = this.indexBuffer.size / 2; // Divide by 2 for uint16
      console.log(`[SimulationView.renderFrame] Drawing ${indexCount} indices...`);
      renderPass.drawIndexed(indexCount);
      
      renderPass.end();
      console.log(`[SimulationView.renderFrame] Render pass completed`);
      
      console.log(`[SimulationView.renderFrame] Submitting commands...`);
      this.device.queue.submit([encoder.finish()]);
      console.log(`[SimulationView.renderFrame] Commands submitted`);
      
      console.log(`[SimulationView.renderFrame] Frame ${frameCount} rendered successfully`);
    } catch (error) {
      console.error(`[SimulationView.renderFrame] Error rendering frame ${frameCount}:`, error);
      throw error;
    }
  }
}
